import { ProductForm } from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <div>
      <h1 className="mb-6 text-lg font-bold text-foreground">Novo produto</h1>
      <ProductForm />
    </div>
  );
}
