"use client";

import { useEffect, useState } from "react";

const OFFER_DURATION_MS = 15 * 60 * 1000; // always 15:00, restarted per browser session

function splitRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return { h: pad(h), m: pad(m), s: pad(s) };
}

function storageKey(productId: string) {
  return `offer-deadline:${productId}`;
}

// Reads the deadline saved for this browser session, or mints a fresh 15-minute one
// (and persists it) if none exists yet or the saved one already passed.
function getOrInitDeadline(productId: string): number {
  const key = storageKey(productId);
  try {
    const stored = window.sessionStorage.getItem(key);
    if (stored) {
      const deadline = Number(stored);
      if (Number.isFinite(deadline) && deadline > Date.now()) return deadline;
    }
  } catch {
    // sessionStorage unavailable (privacy mode, etc.) — fall back to an in-memory-only deadline below
  }
  const deadline = Date.now() + OFFER_DURATION_MS;
  try {
    window.sessionStorage.setItem(key, String(deadline));
  } catch {
    // ignore — worst case the timer just resets on next render
  }
  return deadline;
}

// Alarm clock + "%" — deliberately a plain, generic alarm-clock glyph (not a lightning
// bolt), so it doesn't lean on any specific marketplace's iconography.
function AlarmDiscountIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M4 4l2.5 2M20 4l-2.5 2" strokeLinecap="round" />
      <circle cx="12" cy="13.5" r="8" />
      <path d="M12 9.5v4l2.5 1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.2 21c.8.6 1.8 1 2.8 1s2-.4 2.8-1" strokeLinecap="round" />
      <g strokeWidth="1.3">
        <circle cx="9.7" cy="12" r="0.9" fill="currentColor" stroke="none" />
        <circle cx="14.3" cy="15" r="0.9" fill="currentColor" stroke="none" />
        <path d="M9.5 15.2l5-5.2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function DigitBlock({ value }: { value: string }) {
  return (
    <span className="rounded bg-[#1a1a1a] px-1.5 py-0.5 font-mono text-sm font-bold tabular-nums text-white">
      {value}
    </span>
  );
}

// The offer countdown is deliberately NOT tied to product.offerExpiresAt (an
// admin-set deadline in the database) — that field is kept only as historical
// metadata now (see ProductForm "Preços & Oferta" tab). Instead, every visitor gets
// their own fresh 15-minute countdown starting the moment they land on the page,
// persisted in sessionStorage so it survives re-renders/navigation within the same
// tab but resets on a new session. When it reaches zero it silently restarts another
// 15-minute cycle for as long as offerEnabled stays true — there is no permanent
// "offer ended" state by design (Refinamento 1).
export function OfferBanner({
  productId,
  offerEnabled,
  discountPercent,
}: {
  productId: string;
  offerEnabled: boolean;
  discountPercent: number | null;
}) {
  const [now, setNow] = useState<number | null>(null);
  const [deadline, setDeadline] = useState<number | null>(null);

  useEffect(() => {
    if (!offerEnabled) return;

    function tick() {
      const t = Date.now();
      setDeadline((prev) => {
        const current = prev ?? getOrInitDeadline(productId);
        if (t >= current) {
          // Cycle restarts: mint and persist a new 15-minute deadline.
          const next = Date.now() + OFFER_DURATION_MS;
          try {
            window.sessionStorage.setItem(storageKey(productId), String(next));
          } catch {
            // ignore
          }
          return next;
        }
        return current;
      });
      setNow(t);
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [offerEnabled, productId]);

  if (!offerEnabled) return null;

  const gradient = "bg-[linear-gradient(90deg,var(--warning),var(--price))]";

  // Avoid a hydration mismatch: render nothing time-dependent until mounted.
  if (now === null || deadline === null) {
    return (
      <div className={`flex w-full items-center gap-1.5 ${gradient} px-3 py-2.5 text-sm font-bold uppercase tracking-wide text-white`}>
        <AlarmDiscountIcon />
        <span>Ofertas relâmpago</span>
      </div>
    );
  }

  const { h, m, s } = splitRemaining(deadline - now);

  return (
    <div className={`flex w-full items-center justify-between gap-2 ${gradient} px-3 py-2.5 text-white`}>
      <span className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide">
        <AlarmDiscountIcon />
        {discountPercent ? `Ofertas relâmpago – ${discountPercent}% OFF` : "Ofertas relâmpago"}
      </span>
      <span className="flex flex-shrink-0 items-center gap-1 text-[11px] font-semibold uppercase tracking-wide" aria-live="polite" aria-label={`Termina em ${h}:${m}:${s}`}>
        Termina em
        <span className="flex items-center gap-0.5">
          <DigitBlock value={h} />
          <span className="font-bold">:</span>
          <DigitBlock value={m} />
          <span className="font-bold">:</span>
          <DigitBlock value={s} />
        </span>
      </span>
    </div>
  );
}
