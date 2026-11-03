import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const scopeParam = searchParams.get("scope");
  const scope = scopeParam === "clicks" || scopeParam === "all" ? scopeParam : "orders";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = 20;

  // "Comprar" creates an Order the instant it's clicked, before the customer has seen
  // the checkout form — customerName is only ever set once they actually submit it
  // (or pay). scope=orders (default) is real orders (preencheram a ficha); scope=clicks
  // is quem clicou e não preencheu; scope=all é TODOS os pedidos gerados (os dois juntos).
  const scopeWhere = scope === "clicks" ? { customerName: null } : scope === "all" ? {} : { customerName: { not: null } };
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
