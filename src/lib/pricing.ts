import type { Product, ProductVariant } from "@/generated/prisma/client";

// Single source of truth for "what does this product cost / how much is in stock /
// where does Buy go" once a variant is selected. Every surface (product page,
// checkout API, admin) must call this instead of re-deriving price/stock itself —
// see Section 20/43 of the spec: price, stock and checkout target never diverge
// between the DOM, JS state and the DB.
export function resolveEffectiveProduct(
  product: Pick<Product, "priceCents" | "compareAtPriceCents" | "stock" | "checkoutUrl">,
  variant: Pick<ProductVariant, "priceCents" | "stock" | "checkoutUrl" | "imageUrl"> | null | undefined
) {
  return {
    priceCents: variant?.priceCents ?? product.priceCents,
    compareAtPriceCents: variant?.priceCents ? null : product.compareAtPriceCents,
    stock: variant ? variant.stock : product.stock,
    checkoutUrl: variant?.checkoutUrl ?? product.checkoutUrl ?? null,
    imageUrl: variant?.imageUrl ?? null,
  };
}

export type OfferState =
  | { active: true; remainingMs: number; expiresAtISO: string }
  | { active: false; expired: boolean };

// The deadline (offerExpiresAt) is the only source of truth for when an offer ends.
// The client renders a countdown from it but never owns or extends the timer itself,
// and a manipulated device clock cannot grant a discount server-side operations
// don't also check — see resolveEffectiveProduct() above, which is what checkout
// actually charges against.
export function computeOfferState(
  product: Pick<Product, "offerEnabled" | "offerExpiresAt">,
  now: Date = new Date()
): OfferState {
  if (!product.offerEnabled || !product.offerExpiresAt) {
    return { active: false, expired: false };
  }
  const remainingMs = product.offerExpiresAt.getTime() - now.getTime();
  if (remainingMs <= 0) {
    return { active: false, expired: true };
  }
  return { active: true, remainingMs, expiresAtISO: product.offerExpiresAt.toISOString() };
}
