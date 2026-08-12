import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orderStatusUpdateSchema } from "@/lib/validation";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

// Order status here is always a manual admin action — see the OrderStatus doc note
// in prisma/schema.prisma: there is no confirmed webhook/API into the external
// checkout, so nothing in this codebase sets a status past PENDING automatically.
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await getSession();
  const body = await req.json().catch(() => null);
  const parsed = orderStatusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }

  const order = await db.order.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }

  const updated = await db.order.update({ where: { id }, data: { status: parsed.data.status } });

  await logAudit({
    adminId: session?.adminId ?? null,
    action: "ORDER_STATUS_CHANGED",
    entity: "Order",
    entityId: id,
    metadata: { from: order.status, to: parsed.data.status },
  });

  return NextResponse.json(updated);
}
