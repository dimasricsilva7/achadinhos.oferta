function Star({ filled }: { filled: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill={filled ? "var(--star)" : "none"} stroke="var(--star)" strokeWidth="1.2">
      <path d="M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6.1L10 14.9l-5.4 3 1.3-6.1L1.3 7.7l6.1-.6L10 1.5z" />
    </svg>
  );
}

export function RatingSold({ ratingAverage, ratingCount, soldCount }: { ratingAverage: number; ratingCount: number; soldCount: number }) {
  if (ratingCount === 0 && soldCount === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground/60">
      {ratingCount > 0 && (
        <span className="flex items-center gap-1">
          <span className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} filled={i < Math.round(ratingAverage)} />
            ))}
          </span>
          <span className="font-medium text-foreground/80">{ratingAverage.toFixed(1)}</span>
          <span>({ratingCount})</span>
        </span>
      )}
      {soldCount > 0 && <span>{soldCount.toLocaleString("pt-BR")} vendidos</span>}
    </div>
  );
}
