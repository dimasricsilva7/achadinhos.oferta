"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

type Order = { orderNumber: string; totalCents: number };

// Fires the Meta Pixel "Purchase" event on /obrigado, once per page load — only when a
// real, correlated Order was found. Fires fbq('track','Purchase', { value, currency },
// { eventID }) client-side, then calls POST /api/meta/purchase with the SAME eventId so
// the Conversions API (server-side) reinforcement can be deduplicated by Meta against
// this client event.
//
// Deliberately never fires a valueless/uncorrelated Purchase when no order is found.
// That used to be the common case back when checkout was hosted externally
// (bravopay.club) and couldn't send our orderNumber back — now that checkout is ours,
// /obrigado always gets a real ?pedido=, so a missing order means someone navigated
// here directly (bookmark, back button, bot), not a real purchase. Reporting those
// events with no `value` was exactly what showed up as Meta's own "33% of Purchase
// events missing value" data-quality warning in Events Manager.
export function PurchasePixel({
  pixelConfigured,
  order,
}: {
  pixelConfigured: boolean;
  order: Order | null;
}) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (!pixelConfigured || !order || firedRef.current) return;
    firedRef.current = true;

    // fbq is injected by the base Pixel script in the root layout (afterInteractive)
    // — by the time this effect runs the script should already be loaded, but guard
    // anyway in case it hasn't attached yet.
    const fire = () => {
      if (typeof window.fbq !== "function") return;

      const eventId = crypto.randomUUID();

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
