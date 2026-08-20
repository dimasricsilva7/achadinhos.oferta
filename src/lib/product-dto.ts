// Plain, JSON-serializable shape passed from the server component to the client
// product experience — decoupled from Prisma's generated types so the client
// bundle never depends on @prisma/client, and so Date objects become explicit ISO
// strings instead of relying on RSC's implicit Date serialization.

export type ProductImageDTO = {
  id: string;
  url: string;
  alt: string;
  type: string;
  sortOrder: number;
  isPrimary: boolean;
};

export type ProductVariantDTO = {
  id: string;
  groupName: string;
  label: string;
  imageUrl: string | null;
  priceCents: number | null;
  stock: number;
  sortOrder: number;
};

export type ProductSpecDTO = { id: string; label: string; value: string };
export type ProductBenefitDTO = { id: string; icon: string; label: string };

export type ProductAddonDTO = {
  id: string;
  title: string;
  description: string | null;
  durationLabel: string | null;
  priceCents: number;
};

export type ReviewMediaDTO = { id: string; url: string; type: string; thumbnailUrl: string | null };

export type ReviewDTO = {
  id: string;
  customerName: string;
  avatarUrl: string | null;
  rating: number;
  variantLabel: string | null;
  comment: string;
  helpfulCount: number;
  createdAtISO: string;
  media: ReviewMediaDTO[];
};

export type ReviewHighlightDTO = { label: string; text: string };
export type OfferChipDTO = { label: string };

export type StoreInfoDTO = {
  logoUrl: string | null;
  name: string;
  badgeLabel: string | null;
  badgeEnabled: boolean;
  ratingAverage: number;
  ratingCount: number;
  productCount: number;
  responseRatePercent: number;
  activeLabel: string;
};

export type RelatedProductDTO = {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  priceCents: number;
  ratingAverage: number;
  soldCount: number;
};

export type ShippingInfoDTO = {
  enabled: boolean;
  deliveryText: string | null;
  free: boolean;
  originalPriceCents: number | null;
  finalPriceCents: number | null;
};

export type ProductDTO = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  priceCents: number;
  compareAtPriceCents: number | null;
  stock: number;
  soldCount: number;
  ratingAverage: number;
  ratingCount: number;
  offerEnabled: boolean;
  offerExpiresAtISO: string | null;
  offerChips: OfferChipDTO[];
  officialBadge: boolean;
  shipping: ShippingInfoDTO;
  hasCheckout: boolean;
  images: ProductImageDTO[];
  variants: ProductVariantDTO[];
  specifications: ProductSpecDTO[];
  benefits: ProductBenefitDTO[];
  addons: ProductAddonDTO[];
  reviews: ReviewDTO[];
  reviewHighlights: ReviewHighlightDTO[];
};

type FullProduct = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  priceCents: number;
  compareAtPriceCents: number | null;
  stock: number;
  soldCount: number;
  ratingAverage: number;
  ratingCount: number;
  offerEnabled: boolean;
  offerExpiresAt: Date | null;
  offerChips: string | null;
  officialBadge: boolean;
  shippingEnabled: boolean;
  shippingDeliveryText: string | null;
  shippingFree: boolean;
  shippingOriginalPriceCents: number | null;
  shippingFinalPriceCents: number | null;
  checkoutUrl: string | null;
  reviewHighlights: string | null;
  images: { id: string; url: string; alt: string; type: string; sortOrder: number; isPrimary: boolean }[];
  variants: { id: string; groupName: string; label: string; imageUrl: string | null; priceCents: number | null; stock: number; checkoutUrl: string | null; sortOrder: number }[];
  specifications: { id: string; label: string; value: string }[];
  benefits: { id: string; icon: string; label: string }[];
  addons: { id: string; title: string; description: string | null; durationLabel: string | null; priceCents: number; enabled: boolean }[];
  reviews: {
    id: string;
    customerName: string;
    avatarUrl: string | null;
    rating: number;
    variantLabel: string | null;
    comment: string;
    helpfulCount: number;
    createdAt: Date;
    media: { id: string; url: string; type: string; thumbnailUrl: string | null }[];
  }[];
};

function parseReviewHighlights(raw: string | null): ReviewHighlightDTO[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseOfferChips(raw: string | null): OfferChipDTO[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

type RelatedProductSource = {
  id: string;
  slug: string;
  name: string;
  priceCents: number;
  ratingAverage: number;
  soldCount: number;
  images: { url: string }[];
};

export function toRelatedProductDTO(product: RelatedProductSource): RelatedProductDTO {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    imageUrl: product.images[0]?.url ?? null,
    priceCents: product.priceCents,
    ratingAverage: product.ratingAverage,
    soldCount: product.soldCount,
  };
}

export function toProductDTO(product: FullProduct): ProductDTO {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    shortDescription: product.shortDescription,
    description: product.description,
    priceCents: product.priceCents,
    compareAtPriceCents: product.compareAtPriceCents,
    stock: product.stock,
    soldCount: product.soldCount,
    ratingAverage: product.ratingAverage,
    ratingCount: product.ratingCount,
    offerEnabled: product.offerEnabled,
    offerExpiresAtISO: product.offerExpiresAt ? product.offerExpiresAt.toISOString() : null,
    offerChips: parseOfferChips(product.offerChips),
    officialBadge: product.officialBadge,
    shipping: {
      enabled: product.shippingEnabled,
      deliveryText: product.shippingDeliveryText,
      free: product.shippingFree,
      originalPriceCents: product.shippingOriginalPriceCents,
      finalPriceCents: product.shippingFinalPriceCents,
    },
    // A product/variant checkoutUrl is only ever a per-item override now (see
    // /api/checkout/start) — the normal path is env.CHECKOUT_BASE_URL, so checkout is
    // available whenever either one is set.
    hasCheckout:
      Boolean(process.env.CHECKOUT_BASE_URL) ||
      Boolean(product.checkoutUrl) ||
      product.variants.some((v) => v.checkoutUrl),
    images: product.images,
    variants: product.variants.map((v) => ({
      id: v.id,
      groupName: v.groupName,
      label: v.label,
      imageUrl: v.imageUrl,
      priceCents: v.priceCents,
      stock: v.stock,
      sortOrder: v.sortOrder,
    })),
    specifications: product.specifications,
    benefits: product.benefits,
    addons: product.addons
      .filter((a) => a.enabled)
      .map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        durationLabel: a.durationLabel,
        priceCents: a.priceCents,
      })),
    reviews: product.reviews.map((r) => ({
      id: r.id,
      customerName: r.customerName,
      avatarUrl: r.avatarUrl,
      rating: r.rating,
      variantLabel: r.variantLabel,
      comment: r.comment,
      helpfulCount: r.helpfulCount,
      createdAtISO: r.createdAt.toISOString(),
      media: r.media,
    })),
    reviewHighlights: parseReviewHighlights(product.reviewHighlights),
  };
}
