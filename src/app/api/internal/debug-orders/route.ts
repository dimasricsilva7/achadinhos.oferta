import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// TEMPORARY — investigating a conversion-funnel discrepancy (local dev DATABASE_URL
// points to a different/stale database than this live deployment). Read-only.
// DELETE after use.
export async function POST(req: NextRequest) {
  const secret = process.env.CHECKOUT_WEBHOOK_SECRET;
  if (!secret || req.headers.get("x-migrate-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const total = await db.order.count();
  const paid = await db.order.count({ where: { status: "PAID" } });
  const last48h = await db.order.findMany({
    where: { createdAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) } },
    orderBy: { createdAt: "desc" },
    select: { orderNumber: true, status: true, createdAt: true, customerName: true, checkoutUrl: true, totalCents: true, product: { select: { name: true } } },
  });

  return NextResponse.json({ total, paid, count48h: last48h.length, orders: last48h });
}
