import type { ProductAddonDTO } from "@/lib/product-dto";
import { formatCentsBRL } from "@/lib/money";

// "Seguros" — optional add-ons (protection plans, extended warranty) shown as
// checkboxes inside the purchase sheet. Selection only ever feeds the client's
// display total; the actual charge is recomputed server-side from these same
// productId/addonId pairs — see POST /api/checkout/start.
export function AddonSelector({
  addons,
  selectedIds,
  onToggle,
}: {
  addons: ProductAddonDTO[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  if (addons.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-foreground/80">Seguros</p>
      <div className="flex flex-col gap-2">
        {addons.map((addon) => {
          const checked = selectedIds.includes(addon.id);
          return (
            <label
              key={addon.id}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                checked ? "border-brand bg-brand/5" : "border-border"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(addon.id)}
                className="mt-0.5 h-4 w-4 flex-shrink-0 accent-[var(--brand)]"
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">{addon.title}</span>
                  <span className="whitespace-nowrap text-sm font-semibold text-foreground">
                    {formatCentsBRL(addon.priceCents)}
                  </span>
                </span>
                {addon.durationLabel && (
                  <span className="mt-0.5 block text-xs text-foreground/50">{addon.durationLabel}</span>
                )}
                {addon.description && (
                  <span className="mt-0.5 block text-xs text-foreground/60">{addon.description}</span>
                )}
              </span>
            </label>
          );
        })}
      </div>
      <p className="text-[11px] leading-snug text-foreground/45">
        Ao selecionar uma opção de seguro, concordo com as Condições Gerais e os Termos e Condições.
      </p>
    </div>
  );
}
