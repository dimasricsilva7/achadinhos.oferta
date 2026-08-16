import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkoutStartSchema } from "@/lib/validation";
import { resolveEffectiveProduct, computeOfferState } from "@/lib/pricing";
import { orderNumber } from "@/lib/slug";

// This is the only place an order/checkout redirect is created. The client sends
// product id, variant id, and quantity — never a price. Price, stock and the
// checkout destination are always recomputed here from the database (Section 7/66).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = checkoutStartSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }
  const { productId, variantId, quantity, addonIds } = parsed.data;

  const product = await db.product.findUnique({
    where: { id: productId },
    include: { variants: true, addons: true },
  });

  if (!product || product.deletedAt || product.status !== "ACTIVE") {
    return NextResponse.json({ error: "Produto indisponível" }, { status: 404 });
  }

  let variant = null;
  if (variantId) {
    variant = product.variants.find((v) => v.id === variantId) ?? null;
    if (!variant) {
      return NextResponse.json({ error: "Variação inválida" }, { status: 400 });
    }
  } else if (product.variants.length > 0) {
    return NextResponse.json({ error: "Selecione uma variação" }, { status: 400 });
  }

  const effective = resolveEffectiveProduct(product, variant);

  if (quantity > effective.stock) {
    return NextResponse.json(
      { error: `Estoque insuficiente. Disponível: ${effective.stock}` },
      { status: 409 }
    );
  }

  if (!effective.checkoutUrl) {
    return NextResponse.json(
      { error: "Checkout não configurado para este produto. Configure a URL de checkout no painel administrativo." },
      { status: 422 }
    );
  }

  // Offers are informational at the product-page level, but the charged price is
  // always product.priceCents / variant.priceCents — an expired countdown never
  // changes what gets charged, and neither does a manipulated client clock.
  computeOfferState(product);

  // Addons ("Seguros") never take their price from the client — cross-reference the
  // submitted ids against this product's own enabled addons in the database.
  const chosenAddons = product.addons.filter((a) => a.enabled && addonIds.includes(a.id));
  const addonsCents = chosenAddons.reduce((sum, a) => sum + a.priceCents, 0);
  const addonsSnapshot = chosenAddons.map((a) => ({ id: a.id, title: a.title, priceCents: a.priceCents }));

  const order = await db.order.create({
    data: {
      orderNumber: orderNumber(),
      productId: product.id,
      variantId: variant?.id ?? null,
      quantity,
      unitPriceCents: effective.priceCents,
      addonsCents,
      totalCents: effective.priceCents * quantity + addonsCents,
      addonsSnapshot: addonsSnapshot.length > 0 ? JSON.stringify(addonsSnapshot) : null,
      status: "PENDING",
      checkoutUrl: effective.checkoutUrl,
    },
  });

  return NextResponse.json({
    orderNumber: order.orderNumber,
    checkoutUrl: effective.checkoutUrl,
  });
}
