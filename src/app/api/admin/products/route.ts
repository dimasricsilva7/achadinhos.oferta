import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { productUpsertSchema } from "@/lib/validation";
import { createProduct, ProductServiceError } from "@/lib/product-service";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.trim();
  const status = searchParams.get("status");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = 20;

  const where = {
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(q ? { name: { contains: q } } : {}),
  };

  const [items, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { images: { where: { isPrimary: true }, take: 1 } },
    }),
    db.product.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  const body = await req.json().catch(() => null);
  const parsed = productUpsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const product = await createProduct(parsed.data);
    await logAudit({
      adminId: session?.adminId ?? null,
      action: "PRODUCT_CREATED",
      entity: "Product",
      entityId: product?.id,
      metadata: { name: parsed.data.name, priceCents: parsed.data.priceCents },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    if (err instanceof ProductServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
