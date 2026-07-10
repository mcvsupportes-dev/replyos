/**
 * Admin: Per-plan mutations
 * PATCH  /api/admin/plans/[id]   body: partial plan fields
 * DELETE /api/admin/plans/[id]
 */
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/api-guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function readPlans(db: ReturnType<typeof adminDb>): Promise<Record<string, unknown>[]> {
  const snap = await db.ref("plans").get();
  const raw = snap.val() || [];
  return Array.isArray(raw) ? raw : Object.values(raw as Record<string, Record<string, unknown>>);
}

async function writePlans(
  db: ReturnType<typeof adminDb>,
  plans: Record<string, unknown>[]
) {
  await db.ref("plans").set(plans);
}

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

    const plans = await readPlans(db);
    const idx = plans.findIndex((p) => p.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const updated: Record<string, unknown> = { ...plans[idx], updatedAt: Date.now() };
    for (const k of [
      "name",
      "nameAr",
      "price",
      "currency",
      "interval",
      "repliesLimit",
      "storageLimitMb",
      "features",
      "featuresAr",
      "popular",
    ]) {
      if (body[k] !== undefined) {
        if (k === "price" || k === "repliesLimit" || k === "storageLimitMb") {
          updated[k] = Number(body[k]) || 0;
        } else if (k === "features" || k === "featuresAr") {
          updated[k] = Array.isArray(body[k]) ? body[k].map(String) : [];
        } else if (k === "popular") {
          updated[k] = Boolean(body[k]);
        } else {
          updated[k] = String(body[k]);
        }
      }
    }

    // If marking as popular, unset other populars
    if (updated.popular === true) {
      for (let i = 0; i < plans.length; i++) {
        if (i !== idx) plans[i].popular = false;
      }
    }

    plans[idx] = updated;
    await writePlans(db, plans);

    return NextResponse.json({ success: true, plan: updated });
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
    const plans = await readPlans(db);
    const filtered = plans.filter((p) => p.id !== id);
    if (filtered.length === plans.length) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }
    await writePlans(db, filtered);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
