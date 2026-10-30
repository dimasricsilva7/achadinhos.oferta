// Meta Conversions API (server-side). Cada evento é enviado para TODOS os pixels
// configurados em META_CAPI_TOKENS (cada um com seu token), sempre com o MESMO
// event_id do evento disparado no navegador — assim o Meta deduplica o par
// navegador+servidor POR PIXEL, e um reload nunca vira uma segunda conversão.
//
// Os tokens são segredos: lidos só de env (META_CAPI_TOKENS), nunca no banco, nunca
// retornados por API, nunca logados por inteiro.

import { getMetaCapiPairs } from "@/lib/meta-config";

const GRAPH_API_VERSION = "v21.0";

type EventContext = {
  eventId: string;
  eventSourceUrl: string;
  clientIp?: string | null;
  clientUserAgent?: string | null;
};

async function postToPixel(
  pixelId: string,
  token: string,
  eventName: string,
  ctx: EventContext,
  customData: Record<string, unknown>
): Promise<boolean> {
  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: ctx.eventId,
        event_source_url: ctx.eventSourceUrl,
        action_source: "website",
        user_data: {
          client_ip_address: ctx.clientIp ?? undefined,
          client_user_agent: ctx.clientUserAgent ?? undefined,
        },
        custom_data: customData,
      },
    ],
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${pixelId}/events?access_token=${token}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
    );
    if (!res.ok) {
      // Nunca logar a URL/token — só status + trecho da resposta para diagnóstico.
      const text = await res.text().catch(() => "");
      console.error(`[meta-capi] Graph API ${res.status} em ${eventName}/${ctx.eventId} (pixel ${pixelId}): ${text.slice(0, 300)}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[meta-capi] Falha em ${eventName}/${ctx.eventId} (pixel ${pixelId}):`, err instanceof Error ? err.message : err);
    return false;
  }
}

// Nunca lança — é telemetria, fora do caminho crítico do checkout/obrigado.
async function sendToAllPixels(
  eventName: string,
  ctx: EventContext,
  customData: Record<string, unknown>
): Promise<{ ok: boolean; sent: number; total: number }> {
  const pairs = getMetaCapiPairs();
  if (pairs.length === 0) {
    console.warn("[meta-capi] META_CAPI_TOKENS não configurado — pulando Conversions API");
    return { ok: false, sent: 0, total: 0 };
  }
  const results = await Promise.all(pairs.map((p) => postToPixel(p.pixelId, p.token, eventName, ctx, customData)));
  const sent = results.filter(Boolean).length;
  return { ok: sent > 0, sent, total: pairs.length };
}

export function sendPurchaseEvent(input: {
  eventId: string;
  valueCents: number;
  orderNumber: string;
  eventSourceUrl: string;
  clientIp?: string | null;
  clientUserAgent?: string | null;
}) {
  return sendToAllPixels(
    "Purchase",
    { eventId: input.eventId, eventSourceUrl: input.eventSourceUrl, clientIp: input.clientIp, clientUserAgent: input.clientUserAgent },
    { currency: "BRL", value: input.valueCents / 100, order_id: input.orderNumber }
  );
}

export function sendViewContentEvent(input: {
  eventId: string;
  valueCents: number;
  productId: string;
  eventSourceUrl: string;
  clientIp?: string | null;
  clientUserAgent?: string | null;
}) {
  return sendToAllPixels(
    "ViewContent",
    { eventId: input.eventId, eventSourceUrl: input.eventSourceUrl, clientIp: input.clientIp, clientUserAgent: input.clientUserAgent },
    { currency: "BRL", value: input.valueCents / 100, content_ids: [input.productId], content_type: "product" }
  );
}

export function sendAddToCartEvent(input: {
  eventId: string;
  valueCents: number;
  productId: string;
  eventSourceUrl: string;
  clientIp?: string | null;
  clientUserAgent?: string | null;
}) {
  return sendToAllPixels(
    "AddToCart",
    { eventId: input.eventId, eventSourceUrl: input.eventSourceUrl, clientIp: input.clientIp, clientUserAgent: input.clientUserAgent },
    { currency: "BRL", value: input.valueCents / 100, content_ids: [input.productId], content_type: "product" }
  );
}
