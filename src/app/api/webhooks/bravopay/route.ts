import { NextResponse, type NextRequest } from "next/server";
import { processWebhook, statusFromEvent } from "@/lib/payments/bravopay";
import { markOrderPaid } from "@/lib/payments/orders";

export const dynamic = "force-dynamic";

// Webhook da BravoPay — configure no painel BravoPay como:
//   https://<dominio>/api/webhooks/bravopay
// O corpo é lido como texto bruto porque a assinatura HMAC é verificada sobre os
// bytes exatos (ver processWebhook). Sem BRAVOPAY_WEBHOOK_SECRET nenhum evento é
// aceito.
export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (raw.length > 256_000) return NextResponse.json({ error: "payload_too_large" }, { status: 413 });

  const result = processWebhook(raw, req.headers);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: result.reason === "invalid_signature" ? 401 : 400 });
  }

  const { event } = result;
  const status = statusFromEvent(event);
  const orderNumber = event.data.external_reference ?? event.data.metadata?.orderNumber ?? null;

  if (status === "PAID" && orderNumber) {
    await markOrderPaid(orderNumber, { transactionId: event.data.id, amountCents: event.data.amount_cents });
  }

  // 200 para todo evento válido (mesmo os que não exigem ação) evita retentativas.
  return NextResponse.json({ ok: true });
}
