import { NextRequest, NextResponse } from "next/server";
import { getSettings, updateSettings, SettingsServiceError } from "@/lib/settings-service";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  const body = await req.json().catch(() => null);

  try {
    const settings = await updateSettings(body);
    await logAudit({
      adminId: session?.adminId ?? null,
      action: "SETTINGS_UPDATED",
      entity: "Settings",
      entityId: "singleton",
    });
    return NextResponse.json(settings);
  } catch (err) {
    if (err instanceof SettingsServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
