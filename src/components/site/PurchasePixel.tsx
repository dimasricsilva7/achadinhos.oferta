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

    // Server CAPI report fires immediately and unconditionally — this is also just a
    // reinforcement of checkout-bravopay's own direct server-to-server Purchase report
    // (fired the instant payment is confirmed, before the customer even reaches this
    // page — see checkout-bravopay/src/routes/checkout.js), so it's idempotent either
    // way (Order.metaPurchaseEventSentAt). The client fbq call below is best-effort on
    // top of that, with a short poll for late-attaching fbq — never blocks the CAPI call.
    const eventId = crypto.randomUUID();
    fetch("/api/meta/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, orderNumber: order.orderNumber }),
    }).catch(() => {
      // Best-effort telemetry — never surfaced to the user.
    });

    const fireClientPixel = () => {
      if (typeof window.fbq !== "function") return;
      window.fbq(
        "track",
        "Purchase",
        { value: order.totalCents / 100, currency: "BRL" },
        { eventID: eventId }
      );
    };

    if (typeof window.fbq === "function") {
      fireClientPixel();
    } else {
      // Base pixel script uses next/script strategy="afterInteractive" — it may not
      // have attached fbq yet on first paint. Poll briefly instead of missing the
      // event entirely.
      let attempts = 0;
      const interval = setInterval(() => {
        attempts += 1;
        if (typeof window.fbq === "function") {
          clearInterval(interval);
          fireClientPixel();
        } else if (attempts > 20) {
          clearInterval(interval);
        }
      }, 150);
      return () => clearInterval(interval);
    }
  }, [pixelConfigured, order]);

  return null;
}
