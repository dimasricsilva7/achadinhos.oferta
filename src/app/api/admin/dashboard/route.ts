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
// derived from Order rows in our own DB — never a fabricated "saldo disponível"
// (Section 80): we have no confirmed gateway balance API for pagseguropix.org.
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const range = searchParams.get("range") ?? "today";
  const { from, to } = resolveRange(range, searchParams.get("from"), searchParams.get("to"));

  const where = { createdAt: { gte: from, lte: to } };

  const [totalOrders, byStatus, revenueAgg] = await Promise.all([
    db.order.count({ where }),
    db.order.groupBy({ by: ["status"], where, _count: { _all: true } }),
    db.order.aggregate({ where, _sum: { totalCents: true }, _avg: { totalCents: true } }),
  ]);

  const statusCounts = Object.fromEntries(byStatus.map((row) => [row.status, row._count._all]));

  return NextResponse.json({
    range,
    from: from.toISOString(),
    to: to.toISOString(),
    totalOrders,
    statusCounts,
    grossRevenueCents: revenueAgg._sum.totalCents ?? 0,
    averageTicketCents: Math.round(revenueAgg._avg.totalCents ?? 0),
  });
}
