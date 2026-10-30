import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendAddToCartEvent } from "@/lib/meta-capi";

// Chamado no cliente ao clicar em "Comprar" (ver ProductExperience.tsx handleBuy), no
// mesmo instante do fbq('track','AddToCart', ..., { eventID }), com o mesmo eventId
// para dedup cliente + servidor. Esta loja não tem carrinho — "Comprar" é o sinal de
// AddToCart para as plataformas de anúncio. Enviado a todos os pixels.
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

  const result = await sendAddToCartEvent({
    eventId,
    valueCents,
    productId,
    eventSourceUrl: origin,
    clientIp,
    clientUserAgent,
  });

  return NextResponse.json({ ok: true, sent: result.sent, total: result.total });
}
