import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkoutPaySchema } from "@/lib/validation";
import { computeShippingCents, amountToChargeCents } from "@/lib/payments/orders";
import { crediarioConfig, validateCrediario, installmentOptions, onlyDigits } from "@/lib/crediario";
import { getCrediarioSettings, saveCrediarioOrder } from "@/lib/crediario-store";
import { encryptField } from "@/lib/crypto-field";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Registra o pedido no CREDIÁRIO (método por protocolo — NÃO é cartão, não cobra nada
// agora). O cliente envia seus dados (nome, contato, endereço) + os campos do crediário.
// Preço, frete e total são sempre recalculados aqui a partir do pedido. Validação e
// textos vêm da config do admin (mesma regra do navegador). O protocolo é guardado
// criptografado (AES-256-GCM) e nunca vai para URL, logs ou plataformas de anúncio.
type Params = { params: Promise<{ orderNumber: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { orderNumber } = await params;

  const order = await db.order.findUnique({ where: { orderNumber }, include: { product: true } });
  if (!order) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  if (order.status === "PAID") {
    return NextResponse.json({ status: "PAID", redirectUrl: `/obrigado?pedido=${encodeURIComponent(orderNumber)}` });
  }

  const body = await req.json().catch(() => null);
  const parsed = checkoutPaySchema.safeParse(body);
  if (!parsed.success) {
    const fields = Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message]));
    return NextResponse.json({ error: "Confira os dados informados.", fields }, { status: 422 });
  }
  const d = parsed.data;

  const settings = await getCrediarioSettings();
  const cfg = crediarioConfig(settings);
  if (!cfg.enabled) {
    return NextResponse.json({ error: "O crediário está indisponível no momento." }, { status: 503 });
  }

  // Campos do crediário (fora do schema de pagamento) — valida no servidor.
  const c = (body?.crediario ?? {}) as { protocol?: string; validity?: string; cpfLast3?: string; installments?: unknown };
  const input = {
    protocol: onlyDigits(String(c.protocol ?? "")),
    validity: String(c.validity ?? ""),
    cpfLast3: onlyDigits(String(c.cpfLast3 ?? "")),
    installments: Number(c.installments),
  };
  const errs = validateCrediario(input, cfg);
  if (Object.keys(errs).length) {
    const fields = Object.fromEntries(Object.entries(errs).map(([k, v]) => [`crediario.${k}`, v]));
    return NextResponse.json({ error: cfg.errorMessage, fields }, { status: 422 });
  }

  const shipping = computeShippingCents(order.product);
  const amountCents = amountToChargeCents(order.totalCents, shipping);
  const option = installmentOptions(amountCents, cfg).find((o) => o.n === input.installments);
  if (!option) return NextResponse.json({ error: "Parcelamento inválido.", fields: { "crediario.installments": "Escolha o número de parcelas." } }, { status: 422 });

  // Salva os dados do cliente (igual à rota do Pix) e marca o pedido como crediário.
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
      status: "CREDIARIO_PENDENTE",
    },
  });

  await saveCrediarioOrder(order.id, {
    protocolEnc: encryptField(input.protocol),
    protocolLast4: input.protocol.slice(-4),
    validity: input.validity,
    cpfLast: input.cpfLast3,
    installments: option.n,
    installmentCents: option.cents,
    installmentLabel: option.label,
  });

  return NextResponse.json({
    status: "CREDIARIO_PENDENTE",
    title: cfg.successTitle,
    message: cfg.successMessage,
  });
}
