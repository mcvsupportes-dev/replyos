/**
 * Admin: Subscriptions API
 * GET /api/admin/subscriptions   → list all subscriptions
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
    const [subsSnap, usersSnap] = await Promise.all([
      db.ref("subscriptions").get(),
      db.ref("users").get(),
    ]);
    const subs = (subsSnap.val() || {}) as Record<string, Record<string, unknown>>;
    const users = (usersSnap.val() || {}) as Record<string, Record<string, unknown>>;

    const list = Object.entries(subs).map(([id, s]) => {
      const userId = (s.userId as string) || "";
      const user = users[userId];
      return {
        id,
        userId,
        userEmail: (user?.email as string) || "—",
        planId: (s.planId as string) || "free",
        planName: (s.planName as string) || "Free",
        status: (s.status as string) || "trialing",
        currentPeriodEnd: (s.currentPeriodEnd as number) || Date.now(),
        amount: (s.amount as number) || 0,
        currency: (s.currency as string) || "USD",
      };
    });

    return NextResponse.json({ subscriptions: list });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
