import { db } from "@/lib/db";
import type { ProductUpsertInput } from "@/lib/validation";
import { slugify } from "@/lib/slug";

export class ProductServiceError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

async function ensureUniqueSlug(base: string, excludeId?: string): Promise<string> {
  let candidate = slugify(base) || "produto";
  let attempt = 0;
  // Bounded loop — a product catalog will never realistically collide hundreds of times.
  while (attempt < 50) {
    const existing = await db.product.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === excludeId) return candidate;
    attempt += 1;
    candidate = `${slugify(base)}-${attempt + 1}`;
  }
  throw new ProductServiceError("Não foi possível gerar um slug único", 409);
}

type VariantWrite = {
  id?: string;
  groupName: string;
  label: string;
  sku?: string | null;
  imageUrl?: string | null;
  priceCents?: number | null;
  stock: number;
  checkoutUrl?: string | null;
  sortOrder: number;
};
type ImageWrite = { url: string; alt: string; type: string; sortOrder: number; isPrimary: boolean };
type SpecWrite = { label: string; value: string; sortOrder: number };
type BenefitWrite = { icon: string; label: string; sortOrder: number };
type AddonWrite = {
  title: string;
  description?: string | null;
  durationLabel?: string | null;
  priceCents: number;
  sortOrder: number;
  enabled: boolean;
};
type ReviewMediaWrite = { url: string; type: string; thumbnailUrl?: string | null; sortOrder: number };
type ReviewWrite = {
  customerName: string;
  avatarUrl?: string | null;
  rating: number;
  variantLabel?: string | null;
  comment: string;
  helpfulCount: number;
  status: string;
  media: ReviewMediaWrite[];
};

async function syncVariants(productId: string, variants: VariantWrite[]) {
  const existing = await db.productVariant.findMany({ where: { productId } });
  const submittedIds = new Set(variants.filter((v) => v.id).map((v) => v.id));
  const toDelete = existing.filter((v) => !submittedIds.has(v.id));

  for (const variant of toDelete) {
    const orderCount = await db.order.count({ where: { variantId: variant.id } });
    if (orderCount > 0) {
      throw new ProductServiceError(
        `Não é possível remover a variação "${variant.label}" pois há pedidos associados a ela. Defina o estoque como 0 para desativá-la.`,
        409
      );
    }
  }

  await db.productVariant.deleteMany({ where: { id: { in: toDelete.map((v) => v.id) } } });

  for (const variant of variants) {
    const data = {
      productId,
      groupName: variant.groupName,
      label: variant.label,
      sku: variant.sku ?? null,
      imageUrl: variant.imageUrl ?? null,
      priceCents: variant.priceCents ?? null,
      stock: variant.stock,
      checkoutUrl: variant.checkoutUrl ?? null,
      sortOrder: variant.sortOrder,
    };
    if (variant.id) {
      await db.productVariant.update({ where: { id: variant.id }, data });
    } else {
      await db.productVariant.create({ data });
    }
  }
}

async function replaceImages(productId: string, images: ImageWrite[]) {
  await db.productImage.deleteMany({ where: { productId } });
  if (images.length === 0) return;
  await db.productImage.createMany({
    data: images.map((img) => ({
      productId,
      url: img.url,
      alt: img.alt,
      type: img.type,
      sortOrder: img.sortOrder,
      isPrimary: img.isPrimary,
    })),
  });
}

async function replaceSpecs(productId: string, specs: SpecWrite[]) {
  await db.productSpecification.deleteMany({ where: { productId } });
  if (specs.length === 0) return;
  await db.productSpecification.createMany({
    data: specs.map((s) => ({ productId, label: s.label, value: s.value, sortOrder: s.sortOrder })),
  });
}

async function replaceBenefits(productId: string, benefits: BenefitWrite[]) {
  await db.productBenefit.deleteMany({ where: { productId } });
  if (benefits.length === 0) return;
  await db.productBenefit.createMany({
    data: benefits.map((b) => ({ productId, icon: b.icon, label: b.label, sortOrder: b.sortOrder })),
  });
}

// Same delete-and-recreate pattern as specs/benefits above — addons have no orders
// referencing them directly, so no protective diff is needed like syncVariants().
async function replaceAddons(productId: string, addons: AddonWrite[]) {
  await db.productAddon.deleteMany({ where: { productId } });
  if (addons.length === 0) return;
  await db.productAddon.createMany({
    data: addons.map((a) => ({
      productId,
      title: a.title,
      description: a.description ?? null,
      durationLabel: a.durationLabel ?? null,
      priceCents: a.priceCents,
      sortOrder: a.sortOrder,
      enabled: a.enabled,
    })),
  });
}

// Reviews are customer-authored content, not order records — delete-and-recreate is
// safe here (unlike variants, nothing else references a review by id).
async function replaceReviews(productId: string, reviews: ReviewWrite[]) {
  await db.review.deleteMany({ where: { productId } });
  for (const r of reviews) {
    await db.review.create({
      data: {
        productId,
        customerName: r.customerName,
        avatarUrl: r.avatarUrl ?? null,
        rating: r.rating,
        variantLabel: r.variantLabel ?? null,
        comment: r.comment,
        helpfulCount: r.helpfulCount,
        status: r.status,
        media: {
          create: r.media.map((m) => ({
            url: m.url,
            type: m.type,
            thumbnailUrl: m.thumbnailUrl ?? null,
            sortOrder: m.sortOrder,
          })),
        },
      },
    });
  }
}

function baseProductData(input: ProductUpsertInput) {
  return {
    name: input.name,
    shortDescription: input.shortDescription ?? null,
    description: input.description ?? null,
    status: input.status,
    sku: input.sku ?? null,
    priceCents: input.priceCents,
    compareAtPriceCents: input.compareAtPriceCents ?? null,
    stock: input.stock,
    ratingAverage: input.ratingAverage,
    ratingCount: input.ratingCount,
    soldCount: input.soldCount,
    offerEnabled: input.offerEnabled,
    offerExpiresAt: input.offerExpiresAt ? new Date(input.offerExpiresAt) : null,
    offerChips: JSON.stringify(input.offerChips),
    officialBadge: input.officialBadge,
    shippingEnabled: input.shippingEnabled,
    shippingDeliveryText: input.shippingDeliveryText ?? null,
    shippingFree: input.shippingFree,
    shippingOriginalPriceCents: input.shippingOriginalPriceCents ?? null,
    shippingFinalPriceCents: input.shippingFinalPriceCents ?? null,
    checkoutUrl: input.checkoutUrl ?? null,
    reviewHighlights: JSON.stringify(input.reviewHighlights),
  };
}

export async function createProduct(input: ProductUpsertInput) {
  const slug = await ensureUniqueSlug(input.slug || input.name);

  if (input.sku) {
    const skuTaken = await db.product.findUnique({ where: { sku: input.sku } });
    if (skuTaken) throw new ProductServiceError("SKU já está em uso", 409);
  }

  const product = await db.product.create({
    data: { ...baseProductData(input), slug },
  });

  await Promise.all([
    replaceImages(product.id, input.images),
    replaceSpecs(product.id, input.specifications),
    replaceBenefits(product.id, input.benefits),
    replaceAddons(product.id, input.addons),
    replaceReviews(product.id, input.reviews),
  ]);
  await syncVariants(product.id, input.variants);

  return getProductForAdmin(product.id);
}

export async function updateProduct(id: string, input: ProductUpsertInput) {
  const current = await db.product.findUnique({ where: { id } });
  if (!current || current.deletedAt) {
    throw new ProductServiceError("Produto não encontrado", 404);
  }

  const slug = input.slug === current.slug ? current.slug : await ensureUniqueSlug(input.slug, id);

  if (input.sku && input.sku !== current.sku) {
    const skuTaken = await db.product.findUnique({ where: { sku: input.sku } });
    if (skuTaken && skuTaken.id !== id) throw new ProductServiceError("SKU já está em uso", 409);
  }

  await db.product.update({
    where: { id },
    data: { ...baseProductData(input), slug },
  });

  await Promise.all([
    replaceImages(id, input.images),
    replaceSpecs(id, input.specifications),
    replaceBenefits(id, input.benefits),
    replaceAddons(id, input.addons),
    replaceReviews(id, input.reviews),
  ]);
  await syncVariants(id, input.variants);

  return getProductForAdmin(id);
}

export async function duplicateProduct(id: string) {
  const source = await getProductForAdmin(id);
  if (!source) throw new ProductServiceError("Produto não encontrado", 404);

  const slug = await ensureUniqueSlug(`${source.name}-copia`);

  const copy = await db.product.create({
    data: {
      slug,
      name: `${source.name} (cópia)`,
      shortDescription: source.shortDescription,
      description: source.description,
      status: "DRAFT",
      sku: null, // SKU must stay unique — admin sets a new one
      priceCents: source.priceCents,
      compareAtPriceCents: source.compareAtPriceCents,
      stock: source.stock,
      // Metrics, sales history and checkout reference are NOT copied (Section 39).
      soldCount: 0,
      ratingAverage: 0,
      ratingCount: 0,
      offerEnabled: source.offerEnabled,
      offerExpiresAt: source.offerExpiresAt,
      offerChips: source.offerChips,
      officialBadge: source.officialBadge,
      shippingEnabled: source.shippingEnabled,
      shippingDeliveryText: source.shippingDeliveryText,
      shippingFree: source.shippingFree,
      shippingOriginalPriceCents: source.shippingOriginalPriceCents,
      shippingFinalPriceCents: source.shippingFinalPriceCents,
      checkoutUrl: null,
      // Highlights are admin-authored copy about the product, not customer data —
      // safe (and expected) to carry over, unlike reviews themselves.
      reviewHighlights: source.reviewHighlights,
    },
  });

  await replaceImages(
    copy.id,
    source.images.map((i) => ({ url: i.url, alt: i.alt, type: i.type, sortOrder: i.sortOrder, isPrimary: i.isPrimary }))
  );
  await replaceSpecs(
    copy.id,
    source.specifications.map((s) => ({ label: s.label, value: s.value, sortOrder: s.sortOrder }))
  );
  await replaceBenefits(
    copy.id,
    source.benefits.map((b) => ({ icon: b.icon, label: b.label, sortOrder: b.sortOrder }))
  );
  await syncVariants(
    copy.id,
    source.variants.map((v) => ({
      groupName: v.groupName,
      label: v.label,
      sku: null,
      imageUrl: v.imageUrl,
      priceCents: v.priceCents,
      stock: v.stock,
      checkoutUrl: null,
      sortOrder: v.sortOrder,
    }))
  );
  // Addons are copied (they're product configuration); reviews are NOT — reviews are
  // real customer content and must not be fabricated onto an unrelated new product.
  await replaceAddons(
    copy.id,
    source.addons.map((a) => ({
      title: a.title,
      description: a.description,
      durationLabel: a.durationLabel,
      priceCents: a.priceCents,
      sortOrder: a.sortOrder,
      enabled: a.enabled,
    }))
  );

  return getProductForAdmin(copy.id);
}

export async function softDeleteProduct(id: string) {
  const product = await db.product.findUnique({ where: { id } });
  if (!product || product.deletedAt) throw new ProductServiceError("Produto não encontrado", 404);
  await db.product.update({ where: { id }, data: { deletedAt: new Date(), status: "ARCHIVED" } });
}

export function getProductForAdmin(id: string) {
  return db.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { sortOrder: "asc" } },
      specifications: { orderBy: { sortOrder: "asc" } },
      benefits: { orderBy: { sortOrder: "asc" } },
      addons: { orderBy: { sortOrder: "asc" } },
      reviews: {
        orderBy: { createdAt: "desc" },
        include: { media: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });
}

// "Produtos da mesma loja" — this is a single-store project (no multi-vendor
// model), so "same store" just means any other published product. Used by the
// StoreInfo block on the product page. When the admin has picked specific products
// (Settings.storeRelatedProductIds), those are shown, in the chosen order — only
// ones that are still ACTIVE and not the current product. Otherwise falls back to
// auto-picking other active products by soldCount.
export async function getRelatedStoreProducts(excludeProductId: string, pickedIds: string[] = [], limit = 8) {
  const ids = pickedIds.filter((id) => id !== excludeProductId);

  if (ids.length > 0) {
    const picked = await db.product.findMany({
      where: { id: { in: ids }, status: "ACTIVE", deletedAt: null },
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    });
    const byId = new Map(picked.map((p) => [p.id, p]));
    return ids.map((id) => byId.get(id)).filter((p): p is NonNullable<typeof p> => Boolean(p)).slice(0, limit);
  }

  return db.product.findMany({
    where: { status: "ACTIVE", deletedAt: null, id: { not: excludeProductId } },
    orderBy: { soldCount: "desc" },
    take: limit,
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
  });
}

export function countActiveProducts() {
  return db.product.count({ where: { status: "ACTIVE", deletedAt: null } });
}

export function getProductBySlugForStorefront(slug: string) {
  return db.product.findFirst({
    where: { slug, status: "ACTIVE", deletedAt: null },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { sortOrder: "asc" } },
      specifications: { orderBy: { sortOrder: "asc" } },
      benefits: { orderBy: { sortOrder: "asc" } },
      addons: { where: { enabled: true }, orderBy: { sortOrder: "asc" } },
      reviews: {
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        include: { media: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });
}
