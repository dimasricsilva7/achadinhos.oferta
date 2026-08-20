import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// TEMPORARY one-off migration endpoint — applies the checkout-bravopay Order columns
// directly against whichever database this deployment's DATABASE_URL actually points
// to (the Vercel dashboard hides DATABASE_URL_UNPOOLED as "Sensitive", so this runs
// the ALTER TABLE from inside the running app instead of needing that value locally).
// IF NOT EXISTS makes every statement idempotent. DELETE THIS FILE after running once.
export async function POST(req: NextRequest) {
  const secret = process.env.CHECKOUT_WEBHOOK_SECRET;
  if (!secret || req.headers.get("x-migrate-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const statements = [
    `ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "customerName" TEXT`,
    `ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "customerEmail" TEXT`,
    `ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "customerPhone" TEXT`,
    `ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "customerCpf" TEXT`,
    `ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shippingAddress" TEXT`,
    `ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "gatewayTransactionId" TEXT`,
    `ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3)`,
    `UPDATE "Product" SET "checkoutUrl" = NULL WHERE "checkoutUrl" IS NOT NULL`,
    `UPDATE "ProductVariant" SET "checkoutUrl" = NULL WHERE "checkoutUrl" IS NOT NULL`,
  ];

  const results: string[] = [];
  for (const sql of statements) {
    await db.$executeRawUnsafe(sql);
    results.push(sql);
  }

  return NextResponse.json({ ok: true, applied: results });
}
