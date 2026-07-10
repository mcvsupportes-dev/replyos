/**
 * Public Me API — get current user profile for the Flutter mobile app.
 * GET /api/public/me?userToken=...  → { user }
 *
 * Returns the user's profile, plan, WhatsApp connection status, and usage.
 */
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 15;

async function verifyUserToken(userToken: string): Promise<{ uid: string; email: string } | null> {
  if (!userToken) return null;
  try {
    const apiKey = process.env.FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) return null;

    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: userToken }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const user = data.users?.[0];
    if (!user) return null;
    return { uid: user.localId, email: user.email };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userToken = searchParams.get("userToken");

    if (!userToken) {
      return NextResponse.json(
        { error: "userToken is required" },
        { status: 400 }
      );
    }

    const user = await verifyUserToken(userToken);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const db = adminDb();
    const userSnap = await db.ref(`users/${user.uid}`).get();
    const profile = (userSnap.val() || {}) as Record<string, unknown>;

    // Update lastActive
    await db.ref(`users/${user.uid}`).update({ lastActive: Date.now() });

    // Get plan details
    let planDetails: Record<string, unknown> = {};
    const userPlan = (profile.plan as string) || "free";
    try {
      const plansSnap = await db.ref("plans").get();
      const raw = plansSnap.val();
      const arr: Array<Record<string, unknown>> = Array.isArray(raw)
        ? raw
        : raw ? Object.values(raw as Record<string, Record<string, unknown>>) : [];
      planDetails = arr.find((p) => p.id === userPlan) || {};
    } catch {
      // ignore
    }

    return NextResponse.json({
      user: {
        id: user.uid,
        email: user.email,
        name: profile.name || user.email.split("@")[0],
        plan: userPlan,
        status: profile.status || "active",
        createdAt: profile.createdAt || Date.now(),
        lastActive: Date.now(),
        repliesThisMonth: profile.repliesThisMonth || 0,
        storageUsedMb: profile.storageUsedMb || 0,
        whatsapp: profile.whatsapp || null,
      },
      plan: planDetails,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
