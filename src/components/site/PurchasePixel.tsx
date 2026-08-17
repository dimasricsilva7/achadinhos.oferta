"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

type Order = { orderNumber: string; totalCents: number };

// Fires the Meta Pixel "Purchase" event on /obrigado, once per page load.
//
// - Real order found: fires fbq('track','Purchase', { value, currency }, { eventID })
//   client-side, then calls POST /api/meta/purchase with the SAME eventId so the
//   Conversions API (server-side) reinforcement can be deduplicated by Meta against
//   this client event.
// - No order found (the more likely scenario given bravopay.club's checkout pages
//   don't support passing our orderNumber back — see README): fires Purchase with no
//   `value` (we have no real amount to report) — still lets ad platforms count the
//   conversion — but never calls the CAPI route, since there's no real Order to
//   report server-side.
export function PurchasePixel({
  pixelConfigured,
  order,
}: {
  pixelConfigured: boolean;
  order: Order | null;
}) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (!pixelConfigured || firedRef.current) return;
    firedRef.current = true;

    // fbq is injected by the base Pixel script in the root layout (afterInteractive)
    // — by the time this effect runs the script should already be loaded, but guard
    // anyway in case it hasn't attached yet.
    const fire = () => {
      if (typeof window.fbq !== "function") return;

      const eventId = crypto.randomUUID();

      if (order) {
        window.fbq(
          "track",
          "Purchase",
          { value: order.totalCents / 100, currency: "BRL" },
          { eventID: eventId }
        );

        fetch("/api/meta/purchase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId, orderNumber: order.orderNumber }),
        }).catch(() => {
          // Best-effort telemetry — never surfaced to the user.
        });
      } else {
        // No correlated order — still count the conversion, but don't invent a
        // value/currency-less amount. currency is included because Meta expects it
        // whenever `value` would normally be present; omitting `value` here is
        // deliberate, not an oversight.
        window.fbq("track", "Purchase", { currency: "BRL" }, { eventID: eventId });
      }
    };

    if (typeof window.fbq === "function") {
      fire();
    } else {
      // Base pixel script uses next/script strategy="afterInteractive" — it may not
      // have attached fbq yet on first paint. Poll briefly instead of missing the
      // event entirely.
      let attempts = 0;
      const interval = setInterval(() => {
        attempts += 1;
        if (typeof window.fbq === "function") {
          clearInterval(interval);
          fire();
        } else if (attempts > 20) {
          clearInterval(interval);
        }
      }, 150);
      return () => clearInterval(interval);
    }
  }, [pixelConfigured, order]);

  return null;
}
