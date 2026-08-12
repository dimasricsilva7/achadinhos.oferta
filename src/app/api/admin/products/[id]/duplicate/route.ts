import { NextRequest, NextResponse } from "next/server";
import { duplicateProduct, ProductServiceError } from "@/lib/product-service";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await getSession();
  try {
    const copy = await duplicateProduct(id);
    await logAudit({
      adminId: session?.adminId ?? null,
      action: "PRODUCT_DUPLICATED",
      entity: "Product",
      entityId: copy?.id,
      metadata: { sourceId: id },
    });
    return NextResponse.json(copy, { status: 201 });
  } catch (err) {
    if (err instanceof ProductServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
