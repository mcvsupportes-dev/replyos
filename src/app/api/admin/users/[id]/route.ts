/**
 * Admin: Per-user mutations
 * PATCH  /api/admin/users/[id]   body: { status, plan, name, email }
 * DELETE /api/admin/users/[id]
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
    const userRef = db.ref(`users/${id}`);

    const snap = await userRef.get();
    if (!snap.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };

    if (body.name !== undefined) updates.name = String(body.name);
    if (body.email !== undefined) updates.email = String(body.email);

    // Subscription-related fields
    if (body.status !== undefined || body.plan !== undefined) {
      const current = (snap.val() as Record<string, unknown>).subscription as
        | Record<string, unknown>
        | undefined;
      const newSub: Record<string, unknown> = { ...(current || {}) };
      if (body.status !== undefined) newSub.status = String(body.status);
      if (body.plan !== undefined) {
        newSub.planId = String(body.plan);
        newSub.updatedAt = Date.now();
      }
      updates.subscription = newSub;
    }

    if (body.repliesThisMonth !== undefined) {
      updates.repliesThisMonth = Number(body.repliesThisMonth) || 0;
    }
    if (body.storageUsedMb !== undefined) {
      updates.storageUsedMb = Number(body.storageUsedMb) || 0;
    }

    await userRef.update(updates);

    // Log admin action
    try {
      const logRef = db.ref("logs").push();
      await logRef.set({
        level: "info",
        message: `Admin updated user ${id}`,
        source: "admin",
        timestamp: Date.now(),
        meta: { userId: id, fields: Object.keys(updates) },
      });
    } catch {
      // best-effort
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

    // Don't actually delete the auth account (need Auth SDK), but disable user
    await db.ref(`users/${id}`).update({
      disabled: true,
      updatedAt: Date.now(),
    });

    try {
      const logRef = db.ref("logs").push();
      await logRef.set({
        level: "warn",
        message: `Admin deleted user ${id}`,
        source: "admin",
        timestamp: Date.now(),
        meta: { userId: id },
      });
    } catch {
      // best-effort
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
