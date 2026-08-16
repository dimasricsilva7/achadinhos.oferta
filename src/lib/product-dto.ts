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
    hasCheckout: Boolean(product.checkoutUrl) || product.variants.some((v) => v.checkoutUrl),
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
