import { NextResponse } from "next/server";
import { onlineNow } from "@/lib/online";

export const dynamic = "force-dynamic";

// Protegida pelo proxy (src/proxy.ts) junto das demais rotas /api/admin.
export async function GET() {
  return NextResponse.json(await onlineNow());
}
