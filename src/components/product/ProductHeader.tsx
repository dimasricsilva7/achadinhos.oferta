"use client";

import { useRouter } from "next/navigation";

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-neutral-100 text-foreground/70 transition-colors duration-150 hover:bg-neutral-200 active:bg-neutral-300"
    >
      {children}
    </button>
  );
}

// Structure mirrors a generic mobile marketplace product header: back arrow, a
// search-style bar (not a live search — routes back to the catalog), then a row of
// circular icon buttons (chat, share, cart, more). Purely layout/UX convention, no
// third-party branding involved.
export function ProductHeader({
  title,
  onCartClick,
}: {
  title: string;
  onCartClick?: () => void;
}) {
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
    <header className="safe-top sticky top-0 z-30 flex items-center gap-1.5 border-b border-border bg-surface/95 px-2 py-2 backdrop-blur">
      <button
        type="button"
        aria-label="Voltar"
        onClick={() => router.back()}
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-foreground/80 transition-colors duration-150 hover:bg-black/5 active:bg-black/10"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <button
        type="button"
        onClick={() => router.push("/")}
        aria-label="Buscar produtos"
        className="flex h-9 flex-1 items-center gap-2 rounded-full bg-neutral-100 px-3 text-left text-sm text-foreground/50 transition-colors duration-150 hover:bg-neutral-200"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
        </svg>
        <span className="line-clamp-1">{title}</span>
      </button>

      <IconButton label="Conversar com o vendedor" onClick={() => {}}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </IconButton>
      <IconButton label="Compartilhar" onClick={handleShare}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="M8.6 13.5l6.8 3.9M15.4 6.6L8.6 10.5" />
        </svg>
      </IconButton>
      <IconButton label="Ver compra" onClick={onCartClick}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 6h15l-1.5 9h-12L5 3H2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="9" cy="20" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="18" cy="20" r="1.4" fill="currentColor" stroke="none" />
        </svg>
      </IconButton>
      <IconButton label="Mais opções" onClick={() => {}}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="12" cy="19" r="1.6" />
        </svg>
      </IconButton>
    </header>
  );
}
