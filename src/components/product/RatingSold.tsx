function Star({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill={filled ? "var(--star)" : "none"} stroke="var(--star)" strokeWidth="1.2">
      <path d="M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6.1L10 14.9l-5.4 3 1.3-6.1L1.3 7.7l6.1-.6L10 1.5z" />
    </svg>
  );
}

// Small badge shown next to the price — just the sold count, no rating stars here
// (those live in RatingSummary, positioned near the specs/reviews area instead).
// Sold counts >= 1000 are shown rounded down as "Xmil+", matching the generic
// marketplace convention from the reference screenshots (structure only, no brand).
function formatSoldCount(soldCount: number): string {
  if (soldCount >= 1000) {
    return `${Math.floor(soldCount / 1000)}mil+`;
  }
  return soldCount.toLocaleString("pt-BR");
}

export function SoldBadge({ soldCount }: { soldCount: number }) {
  if (soldCount <= 0) return null;
  return (
    <div className="flex flex-shrink-0 items-center gap-1.5 text-xs text-foreground/50">
      <span className="flex items-center gap-0.5">
        {formatSoldCount(soldCount)} Vendido(s)
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-60">
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9a2.5 2.5 0 0 1 4.9.7c0 1.6-2.2 1.8-2.4 3.3" strokeLinecap="round" />
          <circle cx="12" cy="16.6" r="0.6" fill="currentColor" stroke="none" />
        </svg>
      </span>
      <button type="button" aria-label="Favoritar" className="text-foreground/40 transition-colors duration-150 hover:text-price">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 20s-7-4.4-9.5-8.5C.7 8.1 2.4 4.5 6 4a5 5 0 0 1 6 2.3A5 5 0 0 1 18 4c3.6.5 5.3 4.1 3.5 7.5C19 15.6 12 20 12 20Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
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
