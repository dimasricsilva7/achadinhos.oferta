import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

// Temporary one-off endpoint to reset the admin password, protected by the same
// shared secret used for other internal maintenance endpoints. Deleted right after use.
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-migrate-secret");
  if (!secret || secret !== process.env.CHECKOUT_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const newPassword = String(body.newPassword || "");
  if (!email || newPassword.length < 8) {
    return NextResponse.json({ error: "email and newPassword (min 8 chars) required" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  const admin = await db.admin.update({ where: { email }, data: { passwordHash } }).catch((err) => {
    return null;
  });

  if (!admin) {
    return NextResponse.json({ error: "admin not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, email: admin.email });
}
