import { NextRequest, NextResponse } from "next/server";
import { productUpsertSchema } from "@/lib/validation";
import { getProductForAdmin, updateProduct, softDeleteProduct, ProductServiceError } from "@/lib/product-service";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const product = await getProductForAdmin(id);
  if (!product || product.deletedAt) {
    return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
  }
  return NextResponse.json(product);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await getSession();
  const body = await req.json().catch(() => null);
  const parsed = productUpsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const before = await getProductForAdmin(id);
    const product = await updateProduct(id, parsed.data);

    await logAudit({
      adminId: session?.adminId ?? null,
      action: "PRODUCT_UPDATED",
      entity: "Product",
      entityId: id,
    });
    if (before && before.priceCents !== parsed.data.priceCents) {
      await logAudit({
        adminId: session?.adminId ?? null,
        action: "PRICE_CHANGED",
        entity: "Product",
        entityId: id,
        metadata: { from: before.priceCents, to: parsed.data.priceCents },
      });
    }
    if (before && before.stock !== parsed.data.stock) {
      await logAudit({
        adminId: session?.adminId ?? null,
        action: "STOCK_CHANGED",
        entity: "Product",
        entityId: id,
        metadata: { from: before.stock, to: parsed.data.stock },
      });
    }

    return NextResponse.json(product);
  } catch (err) {
    if (err instanceof ProductServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await getSession();
  try {
    await softDeleteProduct(id);
    await logAudit({ adminId: session?.adminId ?? null, action: "PRODUCT_DELETED", entity: "Product", entityId: id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof ProductServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
