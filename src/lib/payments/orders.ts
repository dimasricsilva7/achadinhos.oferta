import { db } from "@/lib/db";

type ShippingFields = { shippingFree: boolean; shippingFinalPriceCents: number | null };

// Frete cobrado no PIX: 0 quando o produto está como grátis/cupom; senão o valor
// final definido no /admin. O app nunca calcula frete real de transportadora — este
// é exatamente o mesmo valor exibido ao cliente na tela de checkout.
export function computeShippingCents(product: ShippingFields): number {
  if (product.shippingFree) return 0;
  const final = product.shippingFinalPriceCents ?? 0;
  return final > 0 ? final : 0;
}

// Valor total a cobrar no PIX = total do pedido (produto + variação + seguros, já
// gravado em order.totalCents na criação) + frete. Computado on-the-fly e NUNCA
// persistido de volta em totalCents, para que um reenvio/reload jamais some o frete
// duas vezes.
export function amountToChargeCents(orderTotalCents: number, shippingCents: number): number {
  return orderTotalCents + shippingCents;
}

/**
 * Marca o pedido como PAGO de forma idempotente. Chamado tanto pelo webhook da
 * BravoPay (server-to-server) quanto pelo polling de status na tela de pagamento —
 * o primeiro a chegar move o pedido; os demais são no-op. Nunca marca pago por um
 * valor abaixo do total do pedido (o frete faz o valor cobrado ficar ACIMA do total).
 */
export async function markOrderPaid(
  orderNumber: string,
  opts: { transactionId?: string; amountCents?: number } = {}
): Promise<{ ok: boolean; alreadyPaid?: boolean; reason?: string }> {
  const order = await db.order.findUnique({ where: { orderNumber } });
  if (!order) return { ok: false, reason: "not_found" };
  if (order.status === "PAID") return { ok: true, alreadyPaid: true };

  if (opts.amountCents != null && opts.amountCents < order.totalCents) {
    return { ok: false, reason: "amount_mismatch" };
  }

  await db.order.update({
    where: { id: order.id },
    data: {
      status: "PAID",
      paidAt: new Date(),
      ...(opts.transactionId ? { gatewayTransactionId: opts.transactionId } : {}),
    },
  });
  return { ok: true };
}
