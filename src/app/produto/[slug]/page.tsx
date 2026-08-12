import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlugForStorefront } from "@/lib/product-service";
import { toProductDTO } from "@/lib/product-dto";
import { ProductExperience } from "@/components/product/ProductExperience";

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

  return <ProductExperience product={toProductDTO(product)} />;
}
