import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orderStatusUpdateSchema } from "@/lib/validation";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

// PENDING is written by POST /api/checkout/start, and PAID is written automatically
// by POST /api/public/orders/[orderNumber]/confirm-payment (called by
// checkout-bravopay once BravoPay confirms the PIX). Anything past PAID is still a
// manual admin action here.
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

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await getSession();

  const order = await db.order.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }

  await db.order.delete({ where: { id } });

  await logAudit({
    adminId: session?.adminId ?? null,
    action: "ORDER_DELETED",
    entity: "Order",
    entityId: id,
    metadata: { orderNumber: order.orderNumber, status: order.status },
  });

  return NextResponse.json({ ok: true });
}
