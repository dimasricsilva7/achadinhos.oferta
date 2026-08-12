import { NextResponse } from "next/server";
import { clearSessionCookie, getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST() {
  const session = await getSession();
  await clearSessionCookie();
  if (session) {
    await logAudit({ adminId: session.adminId, action: "ADMIN_LOGOUT", entity: "Admin", entityId: session.adminId });
  }
  return NextResponse.json({ ok: true });
}
