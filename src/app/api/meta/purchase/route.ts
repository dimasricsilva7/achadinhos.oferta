import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings-service";
import { sendPurchaseEvent } from "@/lib/meta-capi";

// Called client-side from /obrigado (fetch) right after fbq('track', 'Purchase', ...,
// { eventID }) fires in the browser, passing the SAME eventId so Meta deduplicates
// the client + server events. Only makes sense when a real Order was found on the
// thank-you page — the generic (no-correlation) case never calls this route, since
// there is no real order to report to the Conversions API.
const bodySchema = z.object({
  eventId: z.string().min(1).max(200),
  orderNumber: z.string().min(1).max(100),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }
  const { eventId, orderNumber } = parsed.data;

  const order = await db.order.findUnique({ where: { orderNumber } });
  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }

  // Idempotent: a reload of /obrigado (or a retried fetch) never double-sends the
  // server-side event for the same order.
  if (order.metaPurchaseEventSentAt) {
    return NextResponse.json({ ok: true, alreadySent: true });
  }

  const settings = await getSettings();
  if (!settings.metaPixelId) {
    // No Pixel configured — nothing to report server-side either.
    return NextResponse.json({ ok: true, skipped: true });
  }

  const forwardedFor = req.headers.get("x-forwarded-for");
  const clientIp = forwardedFor ? forwardedFor.split(",")[0]?.trim() : null;
  const clientUserAgent = req.headers.get("user-agent");
  const origin = req.headers.get("origin") ?? new URL(req.url).origin;

  const result = await sendPurchaseEvent({
    eventId,
    pixelId: settings.metaPixelId,
    valueCents: order.totalCents,
    orderNumber: order.orderNumber,
    eventSourceUrl: `${origin}/obrigado`,
    clientIp,
    clientUserAgent,
  });

  if (result.ok) {
    await db.order.update({
      where: { id: order.id },
      data: { metaPurchaseEventSentAt: new Date() },
    });
  }

  // Telemetry — don't fail the client just because Graph API had an issue.
  return NextResponse.json({ ok: true, sent: result.ok });
}
