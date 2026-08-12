import type { ProductSpecDTO } from "@/lib/product-dto";

export function Specifications({ specs }: { specs: ProductSpecDTO[] }) {
  if (specs.length === 0) return null;
  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-foreground">Especificações</h2>
      <dl className="divide-y divide-border rounded-lg border border-border text-sm">
        {specs.map((s) => (
          <div key={s.id} className="flex justify-between gap-4 px-3 py-2">
            <dt className="text-foreground/50">{s.label}</dt>
            <dd className="text-right font-medium text-foreground/80">{s.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
