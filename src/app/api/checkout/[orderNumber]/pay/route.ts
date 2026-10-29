import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkoutPaySchema } from "@/lib/validation";
import { createPixTransaction, getTransaction, BravopayError } from "@/lib/payments/bravopay";
import { computeShippingCents, amountToChargeCents } from "@/lib/payments/orders";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Gera (ou reaproveita) o PIX do pedido. O cliente envia seus dados — nome, e-mail,
// telefone, CPF e endereço — mas NUNCA o valor: preço, frete e total são sempre
// recalculados aqui a partir do pedido já criado em /api/checkout/start.
type Params = { params: Promise<{ orderNumber: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { orderNumber } = await params;

  const order = await db.order.findUnique({ where: { orderNumber }, include: { product: true } });
  if (!order) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  if (order.status === "PAID") {
    return NextResponse.json({ status: "PAID", redirectUrl: `/obrigado?pedido=${encodeURIComponent(orderNumber)}` });
  }

  const parsed = checkoutPaySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const fields = Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message]));
    return NextResponse.json({ error: "Confira os dados informados.", fields }, { status: 422 });
  }
  const d = parsed.data;

  const shipping = computeShippingCents(order.product);
  const amountCents = amountToChargeCents(order.totalCents, shipping);

  // Salva os dados do cliente assim que enviados (equivalente ao antigo
  // capture-customer), para o /admin identificar o pedido mesmo sem pagamento.
  const address = {
    cep: d.cep,
    street: d.street,
    number: d.number,
    complement: d.complement ?? "",
    neighborhood: d.neighborhood,
    city: d.city,
    state: d.state,
  };
  await db.order.update({
    where: { id: order.id },
    data: {
      customerName: d.name,
      customerEmail: d.email,
      customerPhone: d.phone,
      customerCpf: d.cpf,
      shippingAddress: JSON.stringify(address),
    },
  });

  try {
    // Se o PIX já foi gerado antes (reload/duplo-envio), reaproveita em vez de criar
    // outra cobrança — a Idempotency-Key abaixo também protege no lado da BravoPay.
    if (order.gatewayTransactionId) {
      const existing = await getTransaction(orderNumber);
      if (existing?.pix) {
        return NextResponse.json({
          status: existing.status === "PAID" ? "PAID" : "PENDING",
          copyPaste: existing.pix.copy_paste,
          expiresAt: existing.pix.expires_at,
          amountCents,
          ...(existing.status === "PAID" ? { redirectUrl: `/obrigado?pedido=${encodeURIComponent(orderNumber)}` } : {}),
        });
      }
    }

    const tx = await createPixTransaction({
      amountCents,
      idempotencyKey: `pix_${orderNumber}`,
      externalReference: orderNumber,
      description: `Pedido ${orderNumber} - ${order.product.name}`.slice(0, 300),
      customer: { name: d.name, email: d.email, cpf: d.cpf, phone: d.phone },
      metadata: { orderNumber, productSlug: order.product.slug },
      expiresInSeconds: 86_400,
    });

    await db.order.update({ where: { id: order.id }, data: { gatewayTransactionId: tx.id } });

    if (!tx.pix) {
      return NextResponse.json({ error: "Não foi possível gerar o PIX agora. Tente novamente." }, { status: 502 });
    }
    return NextResponse.json({
      status: "PENDING",
      copyPaste: tx.pix.copy_paste,
      expiresAt: tx.pix.expires_at,
      amountCents,
    });
  } catch (err) {
    const message = err instanceof BravopayError ? err.message : "Falha ao gerar o PIX. Tente novamente.";
    const status = err instanceof BravopayError ? (err.status >= 400 && err.status < 500 ? 422 : 502) : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
