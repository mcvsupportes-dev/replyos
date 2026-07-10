/**
 * Admin: Subscriptions per-id
 * PATCH  /api/admin/subscriptions/[id]  body: { status, planId, amount }
 * DELETE /api/admin/subscriptions/[id]
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
    const subRef = db.ref(`subscriptions/${id}`);

    const snap = await subRef.get();
    if (!snap.exists()) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (body.status !== undefined) updates.status = String(body.status);
    if (body.planId !== undefined) updates.planId = String(body.planId);
    if (body.planName !== undefined) updates.planName = String(body.planName);
    if (body.amount !== undefined) updates.amount = Number(body.amount) || 0;
    if (body.currentPeriodEnd !== undefined) updates.currentPeriodEnd = Number(body.currentPeriodEnd);

    await subRef.update(updates);

    // Sync user.subscription
    const sub = (snap.val() as Record<string, unknown>) || {};
    const userId = (sub.userId as string) || "";
    if (userId) {
      await db.ref(`users/${userId}/subscription`).update(updates);
    }

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
    await db.ref(`subscriptions/${id}`).remove();
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
