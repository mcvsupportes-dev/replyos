/**
 * Public WhatsApp Send API — for the Flutter mobile app.
 * POST /api/public/whatsapp/send  body: { phoneNumber, to, message, userToken }
 *
 * Authenticates user, then sends via the remote bridge.
 */
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { bridgeSendMessage } from "@/lib/whatsapp-bridge-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

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
    const { phoneNumber, to, message, userToken } = await req.json();

    if (!phoneNumber || !to || !message || !userToken) {
      return NextResponse.json(
        { error: "phoneNumber, to, message, and userToken are required" },
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

    // Verify this phone belongs to the user
    const db = adminDb();
    const userWaSnap = await db.ref(`users/${user.uid}/whatsapp`).get();
    const userWa = userWaSnap.val() as { phoneNumber?: string; status?: string } | null;
    if (!userWa || userWa.phoneNumber !== phoneNumber.replace(/[^\d]/g, "")) {
      return NextResponse.json(
        { error: "This WhatsApp number is not linked to your account" },
        { status: 403 }
      );
    }

    const result = await bridgeSendMessage(phoneNumber, to, message);

    // Log to Firebase for analytics
    const msgRef = db.ref("messages").push();
    await msgRef.set({
      uid: user.uid,
      email: user.email,
      from: phoneNumber.replace(/[^\d]/g, ""),
      to: String(to).replace(/[^\d]/g, ""),
      text: message,
      messageId: result.messageId || null,
      timestamp: Date.now(),
      direction: "outbound",
      source: "mobile",
    });

    // Increment user's repliesThisMonth counter
    await db.ref(`users/${user.uid}`).transaction((current) => {
      const c = (current || {}) as { repliesThisMonth?: number };
      return { ...c, repliesThisMonth: (c.repliesThisMonth || 0) + 1 };
    });

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
