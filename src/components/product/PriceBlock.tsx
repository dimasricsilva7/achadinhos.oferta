import { formatCentsBRL, discountPercent } from "@/lib/money";

export function PriceBlock({ priceCents, compareAtPriceCents }: { priceCents: number; compareAtPriceCents: number | null }) {
  const pct = discountPercent(priceCents, compareAtPriceCents);
  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className="text-2xl font-bold text-price">{formatCentsBRL(priceCents)}</span>
      {compareAtPriceCents && (
        <span className="text-sm text-foreground/40 line-through">{formatCentsBRL(compareAtPriceCents)}</span>
      )}
      {pct !== null && (
        <span className="rounded bg-price/10 px-1.5 py-0.5 text-xs font-semibold text-price">-{pct}%</span>
      )}
    </div>
  );
}
