/**
 * Admin: Logs API
 * GET /api/admin/logs?limit=100&level=error   → list recent logs
 */
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/api-guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard) return guard;

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") || 100), 500);
    const levelFilter = searchParams.get("level");

    const db = adminDb();
    const snap = await db.ref("logs").orderByChild("timestamp").limitToLast(limit).get();
    const raw = snap.val() || {};
    let list = Object.entries(raw).map(([id, l]) => {
      const log = l as Record<string, unknown>;
      return {
        id,
        level: (log.level as string) || "info",
        message: (log.message as string) || "",
        source: (log.source as string) || "system",
        timestamp: (log.timestamp as number) || Date.now(),
        meta: log.meta as Record<string, unknown> | undefined,
      };
    });

    if (levelFilter) {
      list = list.filter((l) => l.level === levelFilter);
    }

    list.sort((a, b) => b.timestamp - a.timestamp);

    return NextResponse.json({ logs: list });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
