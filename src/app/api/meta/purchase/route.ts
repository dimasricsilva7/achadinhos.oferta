import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendPurchaseEvent } from "@/lib/meta-capi";

// Chamado no cliente a partir de /obrigado, logo após fbq('track','Purchase', ...,
// { eventID }), passando o MESMO eventId para o Meta deduplicar cliente + servidor.
// O eventId é determinístico por pedido (purchase_<orderNumber>), então nem reload
// nem retry geram uma segunda conversão.
const bodySchema = z.object({
  eventId: z.string().min(1).max(200),
  orderNumber: z.string().min(1).max(100),
});

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }
  const { eventId, orderNumber } = parsed.data;

  const order = await db.order.findUnique({ where: { orderNumber } });
  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }
  if (order.status !== "PAID") {
    // Nunca reportar conversão de dinheiro que não entrou — infla os dados e bagunça
    // a otimização por ROAS.
    return NextResponse.json({ error: "Pedido ainda não pago" }, { status: 409 });
  }

  // Idempotente: reload de /obrigado (ou refetch) nunca reenvia o Purchase server-side
  // para o mesmo pedido — reforça o "sem enviar o mesmo evento de compra mais de 1x".
  if (order.metaPurchaseEventSentAt) {
    return NextResponse.json({ ok: true, alreadySent: true });
  }

  const forwardedFor = req.headers.get("x-forwarded-for");
  const clientIp = forwardedFor ? forwardedFor.split(",")[0]?.trim() : null;
  const clientUserAgent = req.headers.get("user-agent");
  const origin = req.headers.get("origin") ?? new URL(req.url).origin;

  const result = await sendPurchaseEvent({
    eventId,
    valueCents: order.totalCents,
    orderNumber: order.orderNumber,
    eventSourceUrl: `${origin}/obrigado`,
    clientIp,
    clientUserAgent,
  });

  // Marca como enviado quando pelo menos um pixel aceitou — evita reenvio em reloads.
  if (result.ok) {
    await db.order.update({
      where: { id: order.id },
      data: { metaPurchaseEventSentAt: new Date() },
    });
  }

  return NextResponse.json({ ok: true, sent: result.sent, total: result.total });
}
