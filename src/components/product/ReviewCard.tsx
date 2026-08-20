import type { ReviewDTO } from "@/lib/product-dto";
import { FallbackImg } from "@/components/ui/FallbackMedia";

function Star({ filled }: { filled: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 20 20" fill={filled ? "var(--star)" : "none"} stroke="var(--star)" strokeWidth="1.2">
      <path d="M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6.1L10 14.9l-5.4 3 1.3-6.1L1.3 7.7l6.1-.6L10 1.5z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
      <path d="M8 5v14l11-7L8 5Z" />
    </svg>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ReviewCard({ review }: { review: ReviewDTO }) {
  return (
    <div className="flex flex-col gap-2 border-b border-border py-4 last:border-b-0">
      <div className="flex items-center gap-2">
        <FallbackImg
          src={review.avatarUrl}
          alt=""
          className="h-9 w-9 flex-shrink-0 rounded-full object-cover"
          placeholder={
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand">
              {initials(review.customerName)}
            </span>
          }
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{review.customerName}</p>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} filled={i < review.rating} />
            ))}
          </div>
        </div>
        {review.helpfulCount > 0 && (
          <span className="whitespace-nowrap text-xs text-foreground/45">Útil ({review.helpfulCount})</span>
        )}
      </div>

      {review.variantLabel && (
        <p className="text-xs text-foreground/45">Variação: {review.variantLabel}</p>
      )}

      <p className="text-sm leading-relaxed text-foreground/80">{review.comment}</p>

      {review.media.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {review.media.map((m) => (
            <div key={m.id} className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-neutral-100">
              <FallbackImg src={m.thumbnailUrl || m.url} alt="" className="h-full w-full object-cover" placeholder={null} />
              {m.type === "video" && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                  <PlayIcon />
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
