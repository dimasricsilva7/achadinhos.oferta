import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSettings } from "@/lib/settings-service";
import { sendViewContentEvent } from "@/lib/meta-capi";

// Called client-side when a product page mounts (see ProductExperience.tsx), same
// instant as fbq('track', 'ViewContent', ..., { eventID }) fires in the browser.
const bodySchema = z.object({
  eventId: z.string().min(1).max(200),
  productId: z.string().min(1).max(100),
  valueCents: z.number().int().nonnegative(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }
  const { eventId, productId, valueCents } = parsed.data;

  const settings = await getSettings();
  if (!settings.metaPixelId) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const forwardedFor = req.headers.get("x-forwarded-for");
  const clientIp = forwardedFor ? forwardedFor.split(",")[0]?.trim() : null;
  const clientUserAgent = req.headers.get("user-agent");
  const origin = req.headers.get("origin") ?? new URL(req.url).origin;

  const result = await sendViewContentEvent({
    eventId,
    pixelId: settings.metaPixelId,
    valueCents,
    productId,
    eventSourceUrl: origin,
    clientIp,
    clientUserAgent,
  });

  return NextResponse.json({ ok: true, sent: result.ok });
}
