import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

// Server-to-server callback from checkout-bravopay, called the moment a customer
// submits the checkout form — before any payment confirmation. This lets the site's
// own /admin/orders show who a PENDING order belongs to (name/email/phone/CPF), the
// same way checkout-bravopay's own admin already does from its local store. Separate
// from confirm-payment: this never touches status/paidAt/totalCents, only identifies
// who the order belongs to. Same shared-secret auth as confirm-payment.
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
    console.error("[capture-customer] CHECKOUT_WEBHOOK_SECRET não configurada");
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
  const { customer, address } = parsed.data;

  const order = await db.order.findUnique({ where: { orderNumber } });
  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }

  // Never overwrite customer data that confirm-payment (or a previous call here)
  // already recorded, and never touch anything past this — status/totalCents/paidAt
  // stay confirm-payment's job.
  if (!order.customerName) {
    await db.order.update({
      where: { id: order.id },
      data: {
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        customerCpf: customer.cpf,
        shippingAddress: JSON.stringify(address),
      },
    });
  }

  return NextResponse.json({ ok: true });
}
