import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

// ROTA TEMPORÁRIA de reset de senha do admin, usada UMA vez e removida em seguida.
// Fora de /api/admin de propósito (o middleware em src/proxy.ts exige sessão lá).
// Protegida por ADMIN_RESET_SECRET (valor aleatório, criado só para este reset e
// apagado logo após). A senha nova e o e-mail vêm de variáveis de ambiente, então
// nunca aparecem na URL/logs. Se ADMIN_RESET_SECRET não estiver setada, a rota é inerte.
export async function GET(req: NextRequest) {
  const secret = process.env.ADMIN_RESET_SECRET;
  if (!secret) return NextResponse.json({ error: "disabled" }, { status: 403 });

  const provided = new URL(req.url).searchParams.get("secret");
  if (!provided || provided !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const email = process.env.ADMIN_RESET_EMAIL;
  const password = process.env.ADMIN_NEW_PASSWORD;
  if (!email || !password || password.length < 6) {
    return NextResponse.json({ error: "missing_config" }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);
  const admin = await db.admin.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash, name: "Administrador" },
  });

  return NextResponse.json({ ok: true, email: admin.email });
}
