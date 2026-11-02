import { NextResponse, type NextRequest } from "next/server";
import { touchSession } from "@/lib/online";

export const dynamic = "force-dynamic";

function device(ua: string | null): string {
  if (!ua) return "unknown";
  return /mobile|android|iphone|ipad/i.test(ua) ? "mobile" : "desktop";
}

// Só aceita pings da própria loja (bloqueia uso do endpoint por outros sites).
function isSameOrigin(req: NextRequest): boolean {
  const host = req.headers.get("host");
  const src = req.headers.get("origin") ?? req.headers.get("referer");
  if (!host || !src) return false;
  try {
    return new URL(src).host === host;
  } catch {
    return false;
  }
}

/** Heartbeat do "online ao vivo". Dados anônimos (id de sessão + página). */
export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return NextResponse.json({ ok: false }, { status: 403 });

  const body = (await req.json().catch(() => null)) as
    | { sessionId?: string; visitorId?: string; path?: string; referrer?: string }
    | null;
  if (!body?.sessionId || !body.visitorId) return NextResponse.json({ ok: false }, { status: 400 });

  await touchSession(body.sessionId, body.visitorId, body.path ?? null, device(req.headers.get("user-agent")), body.referrer ?? null);
  return NextResponse.json({ ok: true });
}
