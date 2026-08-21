import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function resolveRange(range: string, fromParam: string | null, toParam: string | null) {
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

  switch (range) {
    case "yesterday": {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return { from: startOfDay(y), to: endOfDay(y) };
    }
    case "7d": {
      const from = new Date(now);
      from.setDate(from.getDate() - 6);
      return { from: startOfDay(from), to: endOfDay(now) };
    }
    case "30d": {
      const from = new Date(now);
      from.setDate(from.getDate() - 29);
      return { from: startOfDay(from), to: endOfDay(now) };
    }
    case "month": {
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: endOfDay(now) };
    }
    case "lastMonth": {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { from, to };
    }
    case "custom": {
      if (fromParam && toParam) {
        return { from: new Date(fromParam), to: endOfDay(new Date(toParam)) };
      }
      return { from: startOfDay(now), to: endOfDay(now) };
    }
    case "today":
    default:
      return { from: startOfDay(now), to: endOfDay(now) };
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
