/**
 * WhatsApp Bridge Admin API — proxy to the remote bridge.
 * GET /api/admin/whatsapp/health    → bridge health check
 * GET /api/admin/whatsapp/sessions  → list all active sessions on the bridge
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-guard";
import { bridgeHealth, bridgeListSessions } from "@/lib/whatsapp-bridge-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 15;

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard) return guard;

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") || "health";

  try {
    if (action === "sessions") {
      const sessions = await bridgeListSessions();
      return NextResponse.json({ sessions, bridge: "remote" });
    }

    // default: health
    const health = await bridgeHealth();
    return NextResponse.json(health);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
