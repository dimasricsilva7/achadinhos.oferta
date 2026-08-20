import type { RelatedProductDTO, StoreInfoDTO } from "@/lib/product-dto";
import { formatCentsBRL } from "@/lib/money";
import { FallbackImg } from "@/components/ui/FallbackMedia";

function Star({ filled }: { filled: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 20 20" fill={filled ? "var(--star)" : "none"} stroke="var(--star)" strokeWidth="1.2">
      <path d="M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6.1L10 14.9l-5.4 3 1.3-6.1L1.3 7.7l6.1-.6L10 1.5z" />
    </svg>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Single-store project (no multi-vendor model) — this block describes the store as a
// whole, sourced from the Settings singleton, and renders on every product page. It
// is positioned between the product's own content (specs/benefits/description) and
// the reviews section, per the reference layout the project owner provided
// (Refinamento 6).
export function StoreInfo({ store, relatedProducts }: { store: StoreInfoDTO; relatedProducts: RelatedProductDTO[] }) {
  return (
    <div className="flex flex-col gap-4 border-t border-border pt-4">
      <div className="flex items-center gap-3 rounded-lg border border-border p-3">
        <FallbackImg
          src={store.logoUrl}
          alt=""
          className="h-12 w-12 flex-shrink-0 rounded-full object-cover"
          placeholder={
            <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand">
              {initials(store.name)}
            </span>
          }
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate text-sm font-semibold text-foreground">{store.name}</p>
            {store.badgeEnabled && store.badgeLabel && (
              <span className="rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand">
                {store.badgeLabel}
              </span>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-foreground/60">
            <span className="flex items-center gap-1">
              <span className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} filled={i < Math.round(store.ratingAverage)} />
                ))}
              </span>
              {store.ratingAverage.toFixed(1)} ({store.ratingCount})
            </span>
            <span>{store.productCount} {store.productCount === 1 ? "produto" : "produtos"}</span>
            <span>{store.responseRatePercent}% resposta</span>
          </div>
          <p className="mt-0.5 text-xs text-foreground/45">{store.activeLabel}</p>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-foreground/80">Produtos da mesma loja</p>
          <div className="flex gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {relatedProducts.map((p) => (
              <a
                key={p.id}
                href={`/produto/${p.slug}`}
                className="flex w-28 flex-shrink-0 flex-col gap-1 overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface"
              >
                <div className="aspect-square w-full overflow-hidden bg-neutral-100">
                  <FallbackImg src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="flex flex-col gap-0.5 px-1.5 pb-1.5">
                  <p className="line-clamp-2 text-[11px] leading-snug text-foreground/80">{p.name}</p>
                  <p className="text-xs font-bold text-price">{formatCentsBRL(p.priceCents)}</p>
                  <p className="text-[10px] text-foreground/45">
                    {p.ratingAverage.toFixed(1)} ★ · {p.soldCount} vendidos
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
