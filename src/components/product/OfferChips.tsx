import type { OfferChipDTO } from "@/lib/product-dto";

// Decorative outline pills shown below the price (e.g. "Compre R$100 e ganhe R$1
// off"). Purely informational copy configured by the admin — no coupon engine or
// discount rule is evaluated from these labels.
export function OfferChips({ chips }: { chips: OfferChipDTO[] }) {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip, i) => (
        <span
          key={i}
          className="flex items-center gap-1 rounded-full border border-brand/40 px-2.5 py-1 text-xs font-medium text-brand"
        >
          {chip.label}
          <span aria-hidden>›</span>
        </span>
      ))}
    </div>
  );
}
