"use client";

import { useEffect, useState } from "react";

function formatRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function LightningIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" />
    </svg>
  );
}

// The countdown only ever renders (offerExpiresAt - now). It never owns or extends
// the deadline itself, so a paused tab, a refresh, or a manipulated device clock
// cannot grant extra time — and it never determines the charged price either; see
// src/app/api/checkout/start/route.ts, which recomputes everything server-side
// regardless of what this component displays (Section 16/64).
export function OfferBanner({
  offerEnabled,
  discountPercent,
  offerExpiresAtISO,
}: {
  offerEnabled: boolean;
  discountPercent: number | null;
  offerExpiresAtISO: string | null;
}) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // First tick happens inside the interval callback (not synchronously here) so
    // the initial render still matches the server (both show the placeholder).
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!offerEnabled || !offerExpiresAtISO) return null;

  const deadline = new Date(offerExpiresAtISO).getTime();
  // Avoid a hydration mismatch: render nothing time-dependent until mounted.
  if (now === null) {
    return (
      <div className="flex items-center gap-1.5 bg-warning px-3 py-2.5 text-sm font-bold uppercase tracking-wide text-white">
        <LightningIcon />
        <span>Oferta relâmpago</span>
      </div>
    );
  }

  const remainingMs = deadline - now;
  const expired = remainingMs <= 0;

  if (expired) {
    return (
      <div className="flex items-center gap-1.5 bg-neutral-500 px-3 py-2.5 text-sm font-bold uppercase tracking-wide text-white">
        <span>Oferta encerrada</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 bg-warning px-3 py-2.5 text-white">
      <span className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide">
        <LightningIcon />
        {discountPercent ? `Oferta relâmpago – ${discountPercent}% OFF` : "Oferta relâmpago"}
      </span>
      <span
        className="rounded bg-black/25 px-2 py-1 font-mono text-base font-bold tabular-nums"
        aria-live="polite"
        aria-label={`Termina em ${formatRemaining(remainingMs)}`}
      >
        {formatRemaining(remainingMs)}
      </span>
    </div>
  );
}
