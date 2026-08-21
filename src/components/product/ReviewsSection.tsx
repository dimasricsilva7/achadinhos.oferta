"use client";

import { useMemo, useState } from "react";
import type { ReviewDTO, ReviewHighlightDTO } from "@/lib/product-dto";
import { RatingSummary } from "@/components/product/RatingSold";
import { ReviewCard } from "@/components/product/ReviewCard";
import { FallbackImg } from "@/components/ui/FallbackMedia";

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <path d="M8 5v14l11-7L8 5Z" />
    </svg>
  );
}

export function ReviewsSection({
  reviews,
  ratingAverage,
  ratingCount,
  reviewHighlights,
}: {
  reviews: ReviewDTO[];
  ratingAverage: number;
  ratingCount: number;
  reviewHighlights: ReviewHighlightDTO[];
}) {
  const [query, setQuery] = useState("");
  const PAGE_SIZE = 5;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Capped, not the full list: with dozens of reviews this strip is purely a visual
  // preview, and rendering every single media item up front (loaded eagerly, before
  // the shopper even scrolls this far) was competing with the actual product image
  // for bandwidth on first load — a real contributor to slow LCP/page-speed on mobile.
  const allMedia = useMemo(
    () => reviews.flatMap((r) => r.media.map((m) => ({ ...m, reviewId: r.id }))).slice(0, 12),
    [reviews]
  );

  const filteredReviews = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return reviews;
    return reviews.filter((r) => r.comment.toLowerCase().includes(q));
  }, [reviews, query]);

  const visibleReviews = filteredReviews.slice(0, visibleCount);
  const hasMore = visibleCount < filteredReviews.length;

  if (reviews.length === 0 && reviewHighlights.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-foreground">Avaliações</h2>

      <RatingSummary ratingAverage={ratingAverage} ratingCount={ratingCount} />

      {reviewHighlights.length > 0 && (
        <div className="rounded-lg border border-border bg-neutral-50 p-3">
          <p className="mb-2 text-sm font-semibold text-foreground">Resumo das avaliações</p>
          <ul className="flex flex-col gap-1.5">
            {reviewHighlights.map((h, i) => (
              <li key={i} className="text-sm leading-relaxed text-foreground/75">
                <span className="font-semibold text-foreground">{h.label}: </span>
                {h.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      {allMedia.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {allMedia.map((m) => (
            <div
              key={m.id}
              className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-neutral-100"
            >
              <FallbackImg src={m.thumbnailUrl || m.url} alt="" loading="lazy" className="h-full w-full object-cover" placeholder={null} />
              {m.type === "video" && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                  <PlayIcon />
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {reviews.length > 0 && (
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40">
            <SearchIcon />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar nas avaliações"
            className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand"
          />
        </div>
      )}

      {filteredReviews.length === 0 ? (
        <p className="py-6 text-center text-sm text-foreground/45">Nenhuma avaliação encontrada.</p>
      ) : (
        <div className="flex flex-col">
          {visibleReviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      )}

      {hasMore && (
        <button
          type="button"
          onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
          className="w-full rounded-lg border border-border py-2.5 text-sm font-medium text-foreground/70 hover:border-brand hover:text-brand"
        >
          Ver mais avaliações ({filteredReviews.length - visibleCount})
        </button>
      )}
    </div>
  );
}
