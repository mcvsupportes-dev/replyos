/**
 * WhatsApp Pairing API — proxies to the remote WhatsApp Bridge.
 * POST   /api/whatsapp/pair   body: { phoneNumber }   → { pairingCode, status }
 * GET    /api/whatsapp/pair?phoneNumber=...           → connection status
 * DELETE /api/whatsapp/pair?phoneNumber=...           → disconnect
 *
 * The bridge runs on the VPS at WHATSAPP_BRIDGE_URL.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-guard";
import {
  bridgeRequestPairing,
  bridgeGetStatus,
  bridgeDisconnect,
} from "@/lib/whatsapp-bridge-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard) return guard;

  try {
    const { phoneNumber } = await req.json();
    if (!phoneNumber || typeof phoneNumber !== "string") {
      return NextResponse.json(
        { error: "phoneNumber is required" },
        { status: 400 }
      );
    }

    const phone = phoneNumber.replace(/[^\d]/g, "");
    if (phone.length < 8) {
      return NextResponse.json(
        { error: "Invalid phone number" },
        { status: 400 }
      );
    }

    // Try the remote bridge first
    try {
      const bridgeResult = await bridgeRequestPairing(phone);

      // Persist the pairing attempt to Firebase for history
      try {
        const { adminDb } = await import("@/lib/firebase-admin");
        const db = adminDb();
        await db.ref(`whatsappConnections/${phone}`).update({
          status: "pairing",
          pairingCode: bridgeResult.pairingCode || null,
          requestedAt: Date.now(),
          bridge: "remote",
        });
      } catch {
        // best-effort
      }

      return NextResponse.json({
        success: true,
        pairingCode: bridgeResult.pairingCode,
        status: bridgeResult.status,
        phoneNumber: phone,
        instructions:
          "افتح واتساب على هاتفك ← الإعدادات ← الأجهزة المرتبطة ← ربط جهاiz ← ربط برقم الهاتف ← أدخل هذا الكود المكوّن من 8 أحرف/أرقام",
        bridge: "remote",
      });
    } catch (bridgeErr) {
      const msg = bridgeErr instanceof Error ? bridgeErr.message : "Bridge error";
      return NextResponse.json(
        { error: msg, bridge: "remote" },
        { status: 500 }
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard) return guard;

  try {
    const { searchParams } = new URL(req.url);
    const phoneNumber = searchParams.get("phoneNumber");
    if (!phoneNumber) {
      return NextResponse.json(
        { error: "phoneNumber query param required" },
        { status: 400 }
      );
    }

    const phone = phoneNumber.replace(/[^\d]/g, "");

    // Try the remote bridge
    try {
      const status = await bridgeGetStatus(phone);
      return NextResponse.json({
        status: status.state,
        state: status.state,
        phoneNumber: phone,
        pairingCode: status.pairingCode,
        user: status.user,
        connectionAt: status.connectionAt,
        lastError: status.lastError,
        bridge: "remote",
      });
    } catch (bridgeErr) {
      const msg = bridgeErr instanceof Error ? bridgeErr.message : "Bridge error";
      return NextResponse.json(
        {
          status: "disconnected",
          phoneNumber: phone,
          lastError: msg,
          bridge: "remote",
        },
        { status: 200 }
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard) return guard;

  try {
    const { searchParams } = new URL(req.url);
    const phoneNumber = searchParams.get("phoneNumber");
    if (!phoneNumber) {
      return NextResponse.json(
        { error: "phoneNumber query param required" },
        { status: 400 }
      );
    }

    const phone = phoneNumber.replace(/[^\d]/g, "");

    // Try the remote bridge
    try {
      await bridgeDisconnect(phone);

      try {
        const { adminDb } = await import("@/lib/firebase-admin");
        const db = adminDb();
        await db.ref(`whatsappConnections/${phone}`).update({
          status: "disconnected",
          disconnectedAt: Date.now(),
        });
      } catch {
        // best-effort
      }

      return NextResponse.json({ success: true, bridge: "remote" });
    } catch (bridgeErr) {
      const msg = bridgeErr instanceof Error ? bridgeErr.message : "Bridge error";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
