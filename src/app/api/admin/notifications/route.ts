/**
 * Admin: Notifications API
 * GET   /api/admin/notifications   → list recent notifications
 * POST  /api/admin/notifications   body: { title, message, type }  → create notification
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
    const db = adminDb();
    const snap = await db.ref("notifications").orderByChild("createdAt").limitToLast(100).get();
    const raw = snap.val() || {};
    const list = Object.entries(raw).map(([id, n]) => {
      const notif = n as Record<string, unknown>;
      return {
        id,
        title: (notif.title as string) || "",
        message: (notif.message as string) || "",
        type: (notif.type as string) || "info",
        read: Boolean(notif.read),
        createdAt: (notif.createdAt as number) || Date.now(),
      };
    }).sort((a, b) => b.createdAt - a.createdAt);
    return NextResponse.json({ notifications: list });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard) return guard;

  try {
    const body = await req.json();
    const { title, message, type } = body;
    if (!title || !message) {
      return NextResponse.json({ error: "title and message are required" }, { status: 400 });
    }

    const db = adminDb();
    const notifRef = db.ref("notifications").push();
    await notifRef.set({
      title: String(title),
      message: String(message),
      type: String(type || "info"),
      read: false,
      createdAt: Date.now(),
    });

    return NextResponse.json({ success: true, id: notifRef.key });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
