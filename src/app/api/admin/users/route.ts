/**
 * Admin: Users API
 * GET    /api/admin/users           → list all users
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
    const snap = await db.ref("users").get();
    const users = snap.val() || {};

    const list = Object.entries(users).map(([id, u]) => {
      const user = u as Record<string, unknown>;
      const sub = (user.subscription as Record<string, unknown>) || {};
      return {
        id,
        email: (user.email as string) || "—",
        name: (user.name as string) || (user.email as string)?.split("@")[0] || "—",
        plan: (sub.planId as string) || "free",
        status: (sub.status as string) || "trial",
        createdAt: (user.createdAt as number) || Date.now(),
        lastActive: (user.lastActive as number) || (user.createdAt as number) || Date.now(),
        repliesThisMonth: (user.repliesThisMonth as number) || 0,
        storageUsedMb: (user.storageUsedMb as number) || 0,
      };
    });

    return NextResponse.json({ users: list });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[API /admin/users] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
