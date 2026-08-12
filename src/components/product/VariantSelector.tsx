import type { ProductVariantDTO } from "@/lib/product-dto";

export function VariantSelector({
  variants,
  selectedId,
  onSelect,
}: {
  variants: ProductVariantDTO[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (variants.length === 0) return null;

  const groups = new Map<string, ProductVariantDTO[]>();
  for (const v of variants) {
    const list = groups.get(v.groupName) ?? [];
    list.push(v);
    groups.set(v.groupName, list);
  }

  return (
    <div className="flex flex-col gap-3">
      {Array.from(groups.entries()).map(([groupName, options]) => (
        <div key={groupName}>
          <p className="mb-2 text-sm font-medium text-foreground/80">{groupName}</p>
          <div className="flex flex-wrap gap-2">
            {options.map((opt) => {
              const outOfStock = opt.stock <= 0;
              const selected = opt.id === selectedId;
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={outOfStock}
                  onClick={() => onSelect(opt.id)}
                  aria-pressed={selected}
                  className={`min-h-11 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    selected
                      ? "border-brand bg-brand/5 font-medium text-brand"
                      : "border-border text-foreground/80 hover:border-foreground/30"
                  } ${outOfStock ? "cursor-not-allowed opacity-40" : ""}`}
                >
                  {opt.label}
                  {outOfStock ? " (esgotado)" : ""}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
