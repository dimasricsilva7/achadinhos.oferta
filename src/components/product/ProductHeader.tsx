"use client";

import { useRouter } from "next/navigation";

export function ProductHeader({ title }: { title: string }) {
  const router = useRouter();

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user cancelled — no-op
      }
      return;
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
    }
  }

  return (
    <header className="safe-top sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-border bg-surface/95 px-2 py-2 backdrop-blur">
      <button
        type="button"
        aria-label="Voltar"
        onClick={() => router.back()}
        className="flex h-11 w-11 items-center justify-center rounded-full text-foreground/80 hover:bg-black/5 active:bg-black/10"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <span className="line-clamp-1 flex-1 text-center text-sm font-medium text-foreground/70">{title}</span>
      <button
        type="button"
        aria-label="Compartilhar"
        onClick={handleShare}
        className="flex h-11 w-11 items-center justify-center rounded-full text-foreground/80 hover:bg-black/5 active:bg-black/10"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="M8.6 13.5l6.8 3.9M15.4 6.6L8.6 10.5" />
        </svg>
      </button>
    </header>
  );
}
