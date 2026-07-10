/**
 * Public Plans API — for the Flutter mobile app.
 * GET /api/public/plans  → list all active plans (no auth required)
 */
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { DEFAULT_PLANS } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    let plans: Array<Record<string, unknown>> = [];
    try {
      const db = adminDb();
      const snap = await db.ref("plans").get();
      const raw = snap.val();
      if (Array.isArray(raw)) {
        plans = raw as Array<Record<string, unknown>>;
      } else if (raw && typeof raw === "object") {
        plans = Object.values(raw as Record<string, Record<string, unknown>>);
      }
    } catch {
      // Firebase not configured — fall back to defaults
    }

    if (plans.length === 0) {
      plans = DEFAULT_PLANS as unknown as Array<Record<string, unknown>>;
    }

    const publicPlans = plans.map((p) => ({
      id: p.id,
      name: p.name,
      nameAr: p.nameAr,
      price: p.price,
      currency: p.currency,
      interval: p.interval,
      repliesLimit: p.repliesLimit,
      storageLimitMb: p.storageLimitMb,
      features: p.features,
      featuresAr: p.featuresAr,
      popular: p.popular,
      subscriberCount: p.subscriberCount || 0,
    }));

    return NextResponse.json({ plans: publicPlans });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
