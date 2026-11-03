import { NextRequest, NextResponse } from "next/server";
import { getCrediarioSettings, saveCrediarioSettings } from "@/lib/crediario-store";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

// Guardado pelo proxy.ts (matcher /api/admin). Config do crediário = tabela própria
// (CrediarioSetting), separada das Settings tipadas — ver src/lib/crediario-store.ts.
export async function GET() {
  return NextResponse.json(await getCrediarioSettings());
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  const patch: Record<string, string> = {};
  for (const [k, v] of Object.entries(body)) patch[k] = typeof v === "string" ? v : String(v ?? "");
  await saveCrediarioSettings(patch);
  await logAudit({ adminId: session?.adminId ?? null, action: "SETTINGS_UPDATED", entity: "CrediarioSetting", entityId: "all" });
  return NextResponse.json(await getCrediarioSettings());
}
