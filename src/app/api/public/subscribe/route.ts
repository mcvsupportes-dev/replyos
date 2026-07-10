/**
 * Public Subscribe API — for the Flutter mobile app.
 * POST /api/public/subscribe  body: { userToken, planId }  → { success, user }
 *
 * Updates the user's plan in Firebase. In production, this would be triggered
 * after a successful payment webhook from Stripe/PayPal.
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

export async function POST(req: NextRequest) {
  try {
    const { userToken, planId } = await req.json();

    if (!userToken || !planId) {
      return NextResponse.json(
        { error: "userToken and planId are required" },
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

    // Verify the plan exists
    let planExists = false;
    let planData: Record<string, unknown> = {};
    try {
      const plansSnap = await db.ref("plans").get();
      const raw = plansSnap.val();
      const arr: Array<Record<string, unknown>> = Array.isArray(raw)
        ? raw
        : raw ? Object.values(raw as Record<string, Record<string, unknown>>) : [];
      const found = arr.find((p) => p.id === planId);
      if (found) {
        planExists = true;
        planData = found;
      }
    } catch {
      // ignore
    }

    if (!planExists && planId !== "free") {
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 404 }
      );
    }

    // Update user's plan
    const now = Date.now();
    const periodEnd = now + 30 * 24 * 60 * 60 * 1000; // +30 days
    await db.ref(`users/${user.uid}`).update({
      plan: planId,
      planUpdatedAt: now,
      planPeriodEnd: periodEnd,
      repliesThisMonth: 0,
    });

    // Create subscription record
    const subRef = db.ref("subscriptions").push();
    await subRef.set({
      id: subRef.key,
      userId: user.uid,
      userEmail: user.email,
      planId,
      planName: planData.name || planId,
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      amount: planData.price || 0,
      currency: planData.currency || "USD",
      createdAt: now,
      source: "mobile",
    });

    return NextResponse.json({
      success: true,
      plan: planId,
      periodEnd,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
