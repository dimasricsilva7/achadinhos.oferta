import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTransaction } from "@/lib/payments/bravopay";
import { markOrderPaid } from "@/lib/payments/orders";

export const dynamic = "force-dynamic";

// Polling consumido pela tela de pagamento a cada poucos segundos. Além do webhook
// (server-to-server), este endpoint consulta a BravoPay direto como fallback — o
// que chegar primeiro move o pedido para PAID (markOrderPaid é idempotente).
type Params = { params: Promise<{ orderNumber: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { orderNumber } = await params;

  const order = await db.order.findUnique({ where: { orderNumber }, select: { status: true, gatewayTransactionId: true } });
  if (!order) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });

  if (order.status === "PAID") {
    return NextResponse.json({ status: "PAID", redirectUrl: `/obrigado?pedido=${encodeURIComponent(orderNumber)}` });
  }

  if (order.gatewayTransactionId) {
    try {
      const tx = await getTransaction(orderNumber);
      if (tx?.status === "PAID") {
        await markOrderPaid(orderNumber, { transactionId: tx.id, amountCents: tx.amount_cents });
        return NextResponse.json({ status: "PAID", redirectUrl: `/obrigado?pedido=${encodeURIComponent(orderNumber)}` });
      }
    } catch {
      // erro transitório de rede/gateway — o cliente segue no polling
    }
  }

  return NextResponse.json({ status: "PENDING" });
}
