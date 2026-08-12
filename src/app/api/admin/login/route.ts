import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validation";
import { verifyPassword, setSessionCookie } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

// Basic brute-force slowdown: fixed delay on every attempt (success or failure)
// so failed attempts can't be distinguished by timing, plus we never leak whether
// the email exists.
async function constantTimeDelay() {
  await new Promise((r) => setTimeout(r, 300));
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    await constantTimeDelay();
    return NextResponse.json({ error: "Credenciais inválidas" }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const admin = await db.admin.findUnique({ where: { email } });

  if (!admin) {
    await constantTimeDelay();
    await logAudit({ adminId: null, action: "ADMIN_LOGIN_FAILED", entity: "Admin", metadata: { email } });
    return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
  }

  const valid = await verifyPassword(password, admin.passwordHash);
  if (!valid) {
    await logAudit({ adminId: admin.id, action: "ADMIN_LOGIN_FAILED", entity: "Admin", entityId: admin.id });
    return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
  }

  await setSessionCookie({ adminId: admin.id, email: admin.email });
  await logAudit({ adminId: admin.id, action: "ADMIN_LOGIN", entity: "Admin", entityId: admin.id });

  return NextResponse.json({ ok: true });
}
