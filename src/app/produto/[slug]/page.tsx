import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlugForStorefront, getRelatedStoreProducts, countActiveProducts } from "@/lib/product-service";
import { toProductDTO, toRelatedProductDTO } from "@/lib/product-dto";
import { ProductExperience } from "@/components/product/ProductExperience";
import { getSettings } from "@/lib/settings-service";
import { getMostRecentAdminLoginAt } from "@/lib/auth";
import { formatActiveAgoLabel } from "@/lib/time-ago";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlugForStorefront(slug);
  if (!product) return { title: "Produto não encontrado" };

  const primaryImage = product.images.find((i) => i.isPrimary)?.url ?? product.images[0]?.url;

  return {
    title: product.name,
    description: product.shortDescription ?? undefined,
    alternates: { canonical: `/produto/${product.slug}` },
    openGraph: {
      title: product.name,
      description: product.shortDescription ?? undefined,
      images: primaryImage ? [primaryImage] : undefined,
    },
    robots: product.status === "ACTIVE" ? undefined : { index: false, follow: false },
  };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const product = await getProductBySlugForStorefront(slug);

  if (!product) notFound();

  const settings = await getSettings();
  const [relatedProducts, lastLoginAt] = await Promise.all([
    getRelatedStoreProducts(product.id, settings.storeRelatedProductIds),
    getMostRecentAdminLoginAt(),
  ]);

  // Only queries the live count when the admin hasn't set a manual storeProductCount.
  const productCount = settings.storeProductCount ?? (await countActiveProducts());

  const store = {
    logoUrl: settings.storeLogoUrl,
    name: settings.siteName,
    badgeLabel: settings.storeBadgeLabel,
    badgeEnabled: settings.storeBadgeEnabled,
    ratingAverage: settings.storeRatingAverage,
    ratingCount: settings.storeRatingCount,
    productCount,
    responseRatePercent: settings.storeResponseRatePercent,
    activeLabel: formatActiveAgoLabel(lastLoginAt),
  };

  return (
    <ProductExperience
      product={toProductDTO(product)}
      store={store}
      relatedProducts={relatedProducts.map(toRelatedProductDTO)}
    />
  );
}
