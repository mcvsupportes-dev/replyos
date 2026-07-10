/**
 * Public Login API — for the Flutter mobile app.
 * POST /api/public/auth/login  body: { email, password }  → { user, token }
 *
 * Uses Firebase Auth (email/password). Returns a custom token the client
 * can use to authenticate subsequent requests.
 */
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 15;

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // For now, we use Firebase REST API to sign in with email/password
    // and return the user + token. The mobile app stores the token.
    const apiKey = process.env.FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Firebase API key not configured" },
        { status: 500 }
      );
    }

    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error?.message || "Login failed" },
        { status: res.status }
      );
    }

    // Fetch or create user profile in DB
    const db = adminDb();
    const uid = data.localId;
    const userRef = db.ref(`users/${uid}`);
    const userSnap = await userRef.get();
    let profile: Record<string, unknown> = {};
    if (userSnap.exists()) {
      profile = userSnap.val() as Record<string, unknown>;
    } else {
      profile = {
        id: uid,
        email,
        name: email.split("@")[0],
        plan: "free",
        status: "active",
        createdAt: Date.now(),
        lastActive: Date.now(),
        repliesThisMonth: 0,
        storageUsedMb: 0,
      };
      await userRef.set(profile);
    }

    // Update lastActive
    await userRef.update({ lastActive: Date.now() });

    return NextResponse.json({
      success: true,
      user: {
        id: uid,
        email,
        name: profile.name || email.split("@")[0],
        plan: profile.plan || "free",
        status: profile.status || "active",
        createdAt: profile.createdAt || Date.now(),
        repliesThisMonth: profile.repliesThisMonth || 0,
        storageUsedMb: profile.storageUsedMb || 0,
      },
      token: data.idToken,
      refreshToken: data.refreshToken,
      expiresIn: data.expiresIn,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
