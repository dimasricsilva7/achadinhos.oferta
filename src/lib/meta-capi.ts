// Meta Conversions API (server-side) — sends the "Purchase" event as a reinforcement
// alongside the client-side Pixel event fired on /obrigado. Shares the same eventId
// with the client call so Meta deduplicates the pair automatically.
//
// META_CAPI_ACCESS_TOKEN is a real secret: read only from process.env here, never
// stored in the database, never returned from any API response, never logged in
// full (see truncation below). The Pixel ID (settings.metaPixelId) is NOT a secret
// and is stored in Settings — see src/lib/settings-service.ts.

const GRAPH_API_VERSION = "v21.0";

type SendEventInput = {
  eventName: "Purchase" | "AddToCart";
  eventId: string;
  pixelId: string;
  eventSourceUrl: string;
  clientIp?: string | null;
  clientUserAgent?: string | null;
  customData: Record<string, unknown>;
};

// Never throws — this is telemetry, not part of the checkout/thank-you critical
// path. Callers should not await-block page rendering on this failing.
export async function sendEvent(input: SendEventInput): Promise<{ ok: boolean }> {
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
  if (!accessToken) {
    console.warn("[meta-capi] META_CAPI_ACCESS_TOKEN not set — skipping Conversions API call");
    return { ok: false };
  }

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${input.pixelId}/events`;

  const payload = {
    data: [
      {
        event_name: input.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        event_source_url: input.eventSourceUrl,
        action_source: "website",
        user_data: {
          client_ip_address: input.clientIp ?? undefined,
          client_user_agent: input.clientUserAgent ?? undefined,
        },
        custom_data: input.customData,
      },
    ],
  };

  try {
    const res = await fetch(`${url}?access_token=${accessToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      // Never log the full URL/body here — it contains the access token as a query
      // param. Log only status + a truncated response for diagnosis.
      const text = await res.text().catch(() => "");
      console.error(
        `[meta-capi] Graph API responded ${res.status} for event ${input.eventName}/${input.eventId}: ${text.slice(0, 300)}`
      );
      return { ok: false };
    }

    return { ok: true };
  } catch (err) {
    console.error(
      `[meta-capi] Failed to send ${input.eventName} event ${input.eventId}:`,
      err instanceof Error ? err.message : err
    );
    return { ok: false };
  }
}

type SendPurchaseEventInput = {
  eventId: string;
  pixelId: string;
  valueCents: number;
  orderNumber: string;
  eventSourceUrl: string;
  clientIp?: string | null;
  clientUserAgent?: string | null;
};

export async function sendPurchaseEvent(input: SendPurchaseEventInput): Promise<{ ok: boolean }> {
  return sendEvent({
    eventName: "Purchase",
    eventId: input.eventId,
    pixelId: input.pixelId,
    eventSourceUrl: input.eventSourceUrl,
    clientIp: input.clientIp,
    clientUserAgent: input.clientUserAgent,
    customData: { currency: "BRL", value: input.valueCents / 100, order_id: input.orderNumber },
  });
}

type SendAddToCartEventInput = {
  eventId: string;
  pixelId: string;
  valueCents: number;
  productId: string;
  eventSourceUrl: string;
  clientIp?: string | null;
  clientUserAgent?: string | null;
};

export async function sendAddToCartEvent(input: SendAddToCartEventInput): Promise<{ ok: boolean }> {
  return sendEvent({
    eventName: "AddToCart",
    eventId: input.eventId,
    pixelId: input.pixelId,
    eventSourceUrl: input.eventSourceUrl,
    clientIp: input.clientIp,
    clientUserAgent: input.clientUserAgent,
    customData: {
      currency: "BRL",
      value: input.valueCents / 100,
      content_ids: [input.productId],
      content_type: "product",
    },
  });
}
