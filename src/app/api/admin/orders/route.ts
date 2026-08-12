import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = 20;

  const where = status ? { status } : {};

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
