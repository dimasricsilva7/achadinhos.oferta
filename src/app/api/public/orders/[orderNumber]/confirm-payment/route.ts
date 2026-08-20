import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

// Server-to-server callback from checkout-bravopay (a separate app/domain) once
// BravoPay confirms a PIX payment — see that project's src/routes/checkout.js
// (refreshAndMaybeNotify) and src/routes/webhook.js. Protected by a shared secret
// (never by orderNumber unguessability alone, since this route has a side effect):
// the caller must send the same value configured here as SITE_INTERNAL_SECRET over
// there, in the X-Checkout-Secret header.
const addressSchema = z.object({
  cep: z.string().max(20),
  street: z.string().max(200),
  number: z.string().max(20),
  complement: z.string().max(200).optional().default(""),
  neighborhood: z.string().max(120),
  city: z.string().max(120),
  state: z.string().max(2),
});

const bodySchema = z.object({
  transactionId: z.string().min(1).max(200),
  amountCents: z.number().int().positive(),
  customer: z.object({
    name: z.string().min(1).max(200),
    email: z.string().email(),
    phone: z.string().max(30),
    cpf: z.string().max(20),
  }),
  address: addressSchema,
});

type Params = { params: Promise<{ orderNumber: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const expectedSecret = process.env.CHECKOUT_WEBHOOK_SECRET;
  if (!expectedSecret) {
    console.error("[confirm-payment] CHECKOUT_WEBHOOK_SECRET não configurada");
    return NextResponse.json({ error: "Não configurado" }, { status: 500 });
  }
  if (req.headers.get("x-checkout-secret") !== expectedSecret) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { orderNumber } = await params;
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }
  const { transactionId, amountCents, customer, address } = parsed.data;

  const order = await db.order.findUnique({ where: { orderNumber } });
  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }

  // Idempotent: BravoPay's webhook and checkout-bravopay's own status polling can
  // both land here for the same payment — only the first call moves the order.
  if (order.status === "PAID") {
    return NextResponse.json({ ok: true, alreadyPaid: true });
  }

  // The amount charged is checkout-bravopay's own truth (product total it fetched
  // from GET /api/public/orders/[orderNumber] + its shipping fee) — sanity-check it
  // against this order's own total instead of trusting it blindly, but allow for the
  // shipping fee on top, which this project doesn't track per-order.
  if (amountCents < order.totalCents) {
    console.error(
      `[confirm-payment] amountCents (${amountCents}) menor que order.totalCents (${order.totalCents}) para ${orderNumber}`
    );
    return NextResponse.json({ error: "Valor divergente" }, { status: 409 });
  }

  await db.order.update({
    where: { id: order.id },
    data: {
      status: "PAID",
      paidAt: new Date(),
      gatewayTransactionId: transactionId,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      customerCpf: customer.cpf,
      shippingAddress: JSON.stringify(address),
      // Bump totalCents to what was actually charged (product + shipping fee applied
      // by checkout-bravopay) — /obrigado's PurchasePixel reports order.totalCents as
      // the Meta Pixel/CAPI Purchase value, and that needs to match the real sale for
      // ROAS to be accurate in Ads Manager.
      totalCents: amountCents,
    },
  });

  return NextResponse.json({ ok: true });
}
