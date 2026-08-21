import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, hashPassword, verifyPassword } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

  if (newPassword.length < 8) {
    return NextResponse.json({ error: "A nova senha deve ter pelo menos 8 caracteres" }, { status: 400 });
  }

  const admin = await db.admin.findUnique({ where: { id: session.adminId } });
  if (!admin) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const valid = await verifyPassword(currentPassword, admin.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Senha atual incorreta" }, { status: 401 });
  }

  const passwordHash = await hashPassword(newPassword);
  await db.admin.update({ where: { id: admin.id }, data: { passwordHash } });
  await logAudit({ adminId: admin.id, action: "ADMIN_PASSWORD_CHANGED", entity: "Admin", entityId: admin.id });

  return NextResponse.json({ ok: true });
}
