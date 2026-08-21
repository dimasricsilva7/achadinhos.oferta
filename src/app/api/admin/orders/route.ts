import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const scope = searchParams.get("scope") === "clicks" ? "clicks" : "orders";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = 20;

  // "Comprar" creates an Order the instant it's clicked, before the customer has seen
  // the checkout form — customerName is only ever set once they actually submit it
  // (or pay). scope=orders (default) is real orders; scope=clicks is everyone who
  // clicked but never got that far — kept in its own list, never mixed with the other.
  const scopeWhere = scope === "clicks" ? { customerName: null } : { customerName: { not: null } };
  const where = status ? { ...scopeWhere, status } : scopeWhere;

  const [items, total] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { product: { select: { name: true, slug: true } }, variant: { select: { label: true, groupName: true } } },
    }),
    db.order.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, pageSize });
}
