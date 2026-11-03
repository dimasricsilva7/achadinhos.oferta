import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// O servidor roda em UTC, mas a loja (e o dono vendo o dashboard) estão no Brasil.
// Sem isto, o "dia de hoje" era o dia UTC: depois das ~21h de Brasília o UTC já virou,
// então uma venda da manhã/tarde do mesmo dia sumia do filtro "Hoje". Brasil é UTC-3 o
// ano todo (sem horário de verão desde 2019), então basta um offset fixo.
const BR_OFFSET_MIN = -180;
// Instante UTC real correspondente a um horário do relógio de Brasília.
const brInstant = (y: number, m: number, d: number, hh = 0, mi = 0, ss = 0, ms = 0) =>
  new Date(Date.UTC(y, m, d, hh, mi, ss, ms) - BR_OFFSET_MIN * 60_000);

function resolveRange(range: string, fromParam: string | null, toParam: string | null) {
  // "Agora" com as partes de data já no fuso de Brasília (lidas via getUTC*).
  const nowBr = new Date(Date.now() + BR_OFFSET_MIN * 60_000);
  const Y = nowBr.getUTCFullYear(), M = nowBr.getUTCMonth(), D = nowBr.getUTCDate();
  const startOfDay = (y: number, m: number, d: number) => brInstant(y, m, d);
  const endOfDay = (y: number, m: number, d: number) => brInstant(y, m, d, 23, 59, 59, 999);

  switch (range) {
    case "yesterday": {
      const y = brInstant(Y, M, D - 1);
      return { from: y, to: endOfDay(Y, M, D - 1) };
    }
    case "7d":
      return { from: startOfDay(Y, M, D - 6), to: endOfDay(Y, M, D) };
    case "30d":
      return { from: startOfDay(Y, M, D - 29), to: endOfDay(Y, M, D) };
    case "month":
      return { from: brInstant(Y, M, 1), to: endOfDay(Y, M, D) };
    case "lastMonth":
      return { from: brInstant(Y, M - 1, 1), to: brInstant(Y, M, 0, 23, 59, 59, 999) };
    case "custom": {
      if (fromParam && toParam) {
        const f = new Date(fromParam), t = new Date(toParam);
        return { from: brInstant(f.getFullYear(), f.getMonth(), f.getDate()), to: brInstant(t.getFullYear(), t.getMonth(), t.getDate(), 23, 59, 59, 999) };
      }
      return { from: startOfDay(Y, M, D), to: endOfDay(Y, M, D) };
    }
    case "today":
    default:
      return { from: startOfDay(Y, M, D), to: endOfDay(Y, M, D) };
  }
}

// Polled every 5s by the admin dashboard client component. Numbers here are always
// derived from Order rows in our own DB. Since checkout-bravopay confirms payment via
// BravoPay's webhook (POST /api/public/orders/[orderNumber]/confirm-payment), PAID is
// now a real, gateway-confirmed status — grossRevenueCents (all orders, incl. pending)
// and paidRevenueCents (PAID only) are both meaningful, not just a guess.
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const range = searchParams.get("range") ?? "today";
  const { from, to } = resolveRange(range, searchParams.get("from"), searchParams.get("to"));

  const where = { createdAt: { gte: from, lte: to } };
  const paidWhere = { ...where, status: "PAID" };
  // "Comprar" creates an Order the instant it's clicked — before the customer has
  // seen the checkout form, let alone filled it (see /api/checkout/start). That means
  // a raw Order count is dominated by clicks that never went anywhere: closed tabs,
  // link-preview bots, second thoughts on the shipping fee. customerName is only ever
  // set once the customer actually submits the checkout form (via checkout-bravopay's
  // capture-customer callback) or pays — so it's the real signal of "someone engaged
  // with checkout", as opposed to "someone's ad click created a database row".
  const engagedWhere = { ...where, customerName: { not: null } };

  const [totalOrders, engagedOrders, byStatus, revenueAgg, paidRevenueAgg] = await Promise.all([
    db.order.count({ where }),
    db.order.count({ where: engagedWhere }),
    // Status breakdown only over real (engaged) orders — a click that never got a name
    // is still technically "PENDING" in the DB, but it doesn't belong in this dashboard.
    db.order.groupBy({ by: ["status"], where: engagedWhere, _count: { _all: true } }),
    // Faturamento total: only real orders count toward this — a click-only row's
    // theoretical price was never actually offered to a paying customer at checkout.
    db.order.aggregate({ where: engagedWhere, _sum: { totalCents: true }, _avg: { totalCents: true } }),
    db.order.aggregate({ where: paidWhere, _sum: { totalCents: true }, _avg: { totalCents: true } }),
  ]);

  const statusCounts = Object.fromEntries(byStatus.map((row) => [row.status, row._count._all]));

  return NextResponse.json({
    range,
    from: from.toISOString(),
    to: to.toISOString(),
    totalOrders,
    engagedOrders,
    clickOnlyOrders: totalOrders - engagedOrders,
    statusCounts,
    grossRevenueCents: revenueAgg._sum.totalCents ?? 0,
    averageTicketCents: Math.round(revenueAgg._avg.totalCents ?? 0),
    paidRevenueCents: paidRevenueAgg._sum.totalCents ?? 0,
    paidAverageTicketCents: Math.round(paidRevenueAgg._avg.totalCents ?? 0),
  });
}
