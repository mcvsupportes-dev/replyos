/**
 * Public WhatsApp Pair API — for the Flutter mobile app.
 * POST   /api/public/whatsapp/pair    body: { phoneNumber, userToken }  → { pairingCode }
 * GET    /api/public/whatsapp/pair?phoneNumber=...&userToken=...        → status
 * DELETE /api/public/whatsapp/pair?phoneNumber=...&userToken=...        → disconnect
 *
 * Authenticates the user via Firebase ID token, then proxies to the remote
 * WhatsApp Bridge. The user's phone is the WhatsApp number they own.
 */
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import {
  bridgeRequestPairing,
  bridgeGetStatus,
  bridgeDisconnect,
} from "@/lib/whatsapp-bridge-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

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
    const { phoneNumber, userToken } = await req.json();

    if (!phoneNumber || !userToken) {
      return NextResponse.json(
        { error: "phoneNumber and userToken are required" },
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

    const phone = phoneNumber.replace(/[^\d]/g, "");
    if (phone.length < 8) {
      return NextResponse.json(
        { error: "Invalid phone number" },
        { status: 400 }
      );
    }

    // Call the remote bridge
    const bridgeResult = await bridgeRequestPairing(phone);

    // Persist in Firebase under this user
    const db = adminDb();
    await db.ref(`users/${user.uid}/whatsapp`).update({
      phoneNumber: phone,
      status: "pairing",
      pairingCode: bridgeResult.pairingCode || null,
      requestedAt: Date.now(),
    });
    await db.ref(`whatsappConnections/${phone}`).update({
      uid: user.uid,
      email: user.email,
      status: "pairing",
      pairingCode: bridgeResult.pairingCode || null,
      requestedAt: Date.now(),
    });

    return NextResponse.json({
      success: true,
      pairingCode: bridgeResult.pairingCode,
      status: bridgeResult.status,
      phoneNumber: phone,
      instructions:
        "افتح واتساب على هاتفك ← الإعدادات ← الأجهزة المرتبطة ← ربط جهاز ← ربط برقم الهاتف ← أدخل هذا الكود المكوّن من 8 أحرف/أرقام",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phoneNumber = searchParams.get("phoneNumber");
    const userToken = searchParams.get("userToken");

    if (!phoneNumber || !userToken) {
      return NextResponse.json(
        { error: "phoneNumber and userToken are required" },
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

    const phone = phoneNumber.replace(/[^\d]/g, "");

    try {
      const status = await bridgeGetStatus(phone);

      // If connected, persist in Firebase
      if (status.state === "open") {
        const db = adminDb();
        await db.ref(`users/${user.uid}/whatsapp`).update({
          phoneNumber: phone,
          status: "connected",
          connectedAt: status.connectionAt || Date.now(),
          user: status.user,
        });
        await db.ref(`whatsappConnections/${phone}`).update({
          uid: user.uid,
          status: "connected",
          connectedAt: status.connectionAt || Date.now(),
          user: status.user,
          pairingCode: null,
        });
      }

      return NextResponse.json({
        status: status.state,
        state: status.state,
        phoneNumber: phone,
        pairingCode: status.pairingCode,
        user: status.user,
        connectionAt: status.connectionAt,
        lastError: status.lastError,
      });
    } catch {
      return NextResponse.json({
        status: "disconnected",
        phoneNumber: phone,
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phoneNumber = searchParams.get("phoneNumber");
    const userToken = searchParams.get("userToken");

    if (!phoneNumber || !userToken) {
      return NextResponse.json(
        { error: "phoneNumber and userToken are required" },
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

    const phone = phoneNumber.replace(/[^\d]/g, "");

    await bridgeDisconnect(phone);

    const db = adminDb();
    await db.ref(`users/${user.uid}/whatsapp`).update({
      status: "disconnected",
      disconnectedAt: Date.now(),
    });
    await db.ref(`whatsappConnections/${phone}`).update({
      status: "disconnected",
      disconnectedAt: Date.now(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
