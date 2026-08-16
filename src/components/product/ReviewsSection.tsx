"use client";

import { useMemo, useState } from "react";
import type { ReviewDTO, ReviewHighlightDTO } from "@/lib/product-dto";
import { RatingSummary } from "@/components/product/RatingSold";
import { ReviewCard } from "@/components/product/ReviewCard";

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

  const allMedia = useMemo(
    () => reviews.flatMap((r) => r.media.map((m) => ({ ...m, reviewId: r.id }))),
    [reviews]
  );

  const filteredReviews = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return reviews;
    return reviews.filter((r) => r.comment.toLowerCase().includes(q));
  }, [reviews, query]);

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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.thumbnailUrl || m.url} alt="" className="h-full w-full object-cover" />
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
          {filteredReviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      )}
    </div>
  );
}
