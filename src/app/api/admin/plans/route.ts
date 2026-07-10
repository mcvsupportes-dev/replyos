/**
 * Admin: Plans API
 * GET   /api/admin/plans   → list all plans (with subscriber counts)
 * POST  /api/admin/plans   → create a new plan
 *   body: { name, nameAr, price, currency, interval, repliesLimit, storageLimitMb, features[], featuresAr[], popular }
 */
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/api-guard";
import { DEFAULT_PLANS } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard) return guard;

  try {
    const db = adminDb();
    // ensure seed data exists
    const plansSnap = await db.ref("plans").get();
    if (!plansSnap.exists()) {
      await db.ref("plans").set(DEFAULT_PLANS);
    }

    const snap = await db.ref("plans").get();
    const raw = snap.val() || DEFAULT_PLANS;
    const plansArr: Record<string, unknown>[] = Array.isArray(raw)
      ? raw
      : Object.values(raw as Record<string, Record<string, unknown>>);

    // subscriber counts
    const subsSnap = await db.ref("subscriptions").get();
    const subs = (subsSnap.val() || {}) as Record<string, { planId?: string; status?: string }>;
    const counts: Record<string, number> = {};
    for (const s of Object.values(subs)) {
      if (s.status === "active" || s.status === "trialing") {
        const pid = s.planId || "free";
        counts[pid] = (counts[pid] || 0) + 1;
      }
    }

    const list = plansArr.map((p) => ({
      ...(p as object),
      subscriberCount: counts[(p.id as string) || ""] || 0,
    }));

    return NextResponse.json({ plans: list });
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
    const {
      name,
      nameAr,
      price,
      currency,
      interval,
      repliesLimit,
      storageLimitMb,
      features,
      featuresAr,
      popular,
    } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Plan name is required" }, { status: 400 });
    }

    const db = adminDb();
    const id = `plan_${Date.now()}`;
    const plan = {
      id,
      name: String(name),
      nameAr: String(nameAr || name),
      price: Number(price) || 0,
      currency: String(currency || "USD"),
      interval: String(interval || "month"),
      repliesLimit: Number(repliesLimit) || 0,
      storageLimitMb: Number(storageLimitMb) || 0,
      features: Array.isArray(features) ? features.map(String) : [],
      featuresAr: Array.isArray(featuresAr) ? featuresAr.map(String) : [],
      popular: Boolean(popular),
      createdAt: Date.now(),
    };

    // If new plan is popular, unset others
    if (plan.popular) {
      const snap = await db.ref("plans").get();
      const raw = snap.val() || {};
      const arr = Array.isArray(raw) ? raw : Object.values(raw as Record<string, Record<string, unknown>>);
      const updated = arr.map((p) =>
        (p as Record<string, unknown>).id === id ? plan : { ...(p as object), popular: false }
      );
      await db.ref("plans").set(updated);
    } else {
      // append
      const snap = await db.ref("plans").get();
      const raw = snap.val() || [];
      const arr = Array.isArray(raw) ? raw : Object.values(raw as Record<string, Record<string, unknown>>);
      arr.push(plan);
      await db.ref("plans").set(arr);
    }

    try {
      const logRef = db.ref("logs").push();
      await logRef.set({
        level: "info",
        message: `Admin created plan ${plan.name}`,
        source: "admin",
        timestamp: Date.now(),
        meta: { planId: id },
      });
    } catch {
      // best-effort
    }

    return NextResponse.json({ success: true, plan });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
