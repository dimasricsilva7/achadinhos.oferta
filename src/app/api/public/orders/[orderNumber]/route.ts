import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Public, read-only order lookup consumed by checkout-bravopay (a separate app on
// its own domain) to render the order review screen and to compute the real amount
// to charge — see POST /api/checkout/start, which is the only place an orderNumber
// is created. No secret required for the base response: an orderNumber is an
// unguessable cuid-style value (see src/lib/slug.ts), and by default this route only
// ever returns pricing/shipping info — never anything a malicious caller could act on.
//
// When the caller sends the same X-Checkout-Secret used by confirm-payment, and the
// order is already PAID, the response also includes the customer/address captured at
// checkout. This is used only by checkout-bravopay's post-purchase order-bump flow
// (see its src/routes/bumps.js) to charge a one-click upsell without asking the
// customer to retype their details — never exposed to an unauthenticated caller.
type Params = { params: Promise<{ orderNumber: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { orderNumber } = await params;

  const order = await db.order.findUnique({
    where: { orderNumber },
    include: { product: true, variant: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }

  const image =
    order.variant?.imageUrl ??
    (await db.productImage.findFirst({
      where: { productId: order.productId, isPrimary: true },
      select: { url: true },
    }))?.url ??
    null;

  const base = {
    orderNumber: order.orderNumber,
    productName: order.product.name,
    productSlug: order.product.slug,
    productImage: image,
    quantity: order.quantity,
    totalCents: order.totalCents,
    shippingFree: order.product.shippingFree,
    shippingFinalPriceCents: order.product.shippingFinalPriceCents,
    shippingDeliveryText: order.product.shippingDeliveryText,
    status: order.status,
  };

  const expectedSecret = process.env.CHECKOUT_WEBHOOK_SECRET;
  const secretMatches = expectedSecret && req.headers.get("x-checkout-secret") === expectedSecret;
  if (!secretMatches || order.status !== "PAID") {
    return NextResponse.json(base);
  }

  return NextResponse.json({
    ...base,
    customer: {
      name: order.customerName,
      email: order.customerEmail,
      phone: order.customerPhone,
      cpf: order.customerCpf,
    },
    address: order.shippingAddress ? JSON.parse(order.shippingAddress) : null,
  });
}
