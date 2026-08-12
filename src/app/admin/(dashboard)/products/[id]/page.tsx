import { notFound } from "next/navigation";
import { getProductForAdmin } from "@/lib/product-service";
import { ProductForm } from "@/components/admin/ProductForm";

type Params = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: Params) {
  const { id } = await params;
  const product = await getProductForAdmin(id);
  if (!product || product.deletedAt) notFound();

  return (
    <div>
      <h1 className="mb-6 text-lg font-bold text-foreground">Editar produto</h1>
      <ProductForm
        initial={{
          id: product.id,
          slug: product.slug,
          name: product.name,
          shortDescription: product.shortDescription,
          description: product.description,
          status: product.status,
          sku: product.sku,
          priceCents: product.priceCents,
          compareAtPriceCents: product.compareAtPriceCents,
          stock: product.stock,
          ratingAverage: product.ratingAverage,
          ratingCount: product.ratingCount,
          soldCount: product.soldCount,
          offerEnabled: product.offerEnabled,
          offerExpiresAt: product.offerExpiresAt ? product.offerExpiresAt.toISOString() : null,
          checkoutUrl: product.checkoutUrl,
          images: product.images,
          variants: product.variants,
          specifications: product.specifications,
          benefits: product.benefits,
        }}
      />
    </div>
  );
}
