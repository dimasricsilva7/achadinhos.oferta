import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendViewContentEvent } from "@/lib/meta-capi";

// Chamado no cliente quando a página de produto monta (ver ProductExperience.tsx), no
// mesmo instante do fbq('track','ViewContent', ..., { eventID }). Enviado a todos os
// pixels com o mesmo eventId para dedup cliente + servidor.
const bodySchema = z.object({
  eventId: z.string().min(1).max(200),
  productId: z.string().min(1).max(100),
  valueCents: z.number().int().nonnegative(),
});

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }
  const { eventId, productId, valueCents } = parsed.data;

  const forwardedFor = req.headers.get("x-forwarded-for");
  const clientIp = forwardedFor ? forwardedFor.split(",")[0]?.trim() : null;
  const clientUserAgent = req.headers.get("user-agent");
  const origin = req.headers.get("origin") ?? new URL(req.url).origin;

  const result = await sendViewContentEvent({
    eventId,
    valueCents,
    productId,
    eventSourceUrl: origin,
    clientIp,
    clientUserAgent,
  });

  return NextResponse.json({ ok: true, sent: result.sent, total: result.total });
}
