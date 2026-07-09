/**
 * Admin: Per-notification
 * PATCH  /api/admin/notifications/[id]   body: { read }
 * DELETE /api/admin/notifications/[id]
 */
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/api-guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin(req);
  if (guard) return guard;

  try {
    const { id } = await params;
    const body = await req.json();
    const db = adminDb();
    await db.ref(`notifications/${id}`).update({
      read: Boolean(body.read),
      updatedAt: Date.now(),
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin(req);
  if (guard) return guard;

  try {
    const { id } = await params;
    const db = adminDb();
    await db.ref(`notifications/${id}`).remove();
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
