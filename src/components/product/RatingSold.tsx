function Star({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill={filled ? "var(--star)" : "none"} stroke="var(--star)" strokeWidth="1.2">
      <path d="M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6.1L10 14.9l-5.4 3 1.3-6.1L1.3 7.7l6.1-.6L10 1.5z" />
    </svg>
  );
}

// Small badge shown next to the price — just the sold count, no rating stars here
// (those live in RatingSummary, positioned near the specs/reviews area instead).
export function SoldBadge({ soldCount }: { soldCount: number }) {
  if (soldCount <= 0) return null;
  return <span className="text-xs text-foreground/50">{soldCount.toLocaleString("pt-BR")} vendidos</span>;
}

export function RatingSummary({ ratingAverage, ratingCount }: { ratingAverage: number; ratingCount: number }) {
  if (ratingCount === 0) return null;
  return (
    <div className="flex items-center gap-2 border-y border-border py-3">
      <span className="text-lg font-bold text-foreground">{ratingAverage.toFixed(1)}</span>
      <span className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} filled={i < Math.round(ratingAverage)} />
        ))}
      </span>
      <span className="text-sm text-foreground/60">Avaliações do produto ({ratingCount.toLocaleString("pt-BR")})</span>
    </div>
  );
}
