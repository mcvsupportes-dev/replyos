/**
 * WhatsApp Pairing Code API
 * POST /api/whatsapp/pair   body: { phoneNumber }   → returns { pairingCode }
 * GET  /api/whatsapp/pair?phoneNumber=...   → returns connection status
 * DELETE /api/whatsapp/pair?phoneNumber=... → disconnect
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-guard";
import {
  requestPairingCode,
  getConnection,
  disconnect,
} from "@/lib/whatsapp-baileys";

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

    // Already connected?
    const existing = getConnection(phone);
    if (existing && existing.status === "open") {
      return NextResponse.json({
        success: true,
        status: "connected",
        user: existing.user,
        message: "Already connected",
      });
    }

    const pairingCode = await requestPairingCode(phone);

    return NextResponse.json({
      success: true,
      pairingCode,
      status: "pairing",
      phoneNumber: phone,
      instructions:
        "Open WhatsApp on your phone → Settings → Linked Devices → Link a Device → enter this 8-digit code",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "ALREADY_CONNECTED") {
      return NextResponse.json({
        success: true,
        status: "connected",
        message: "Already connected",
      });
    }
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
    const session = getConnection(phone);
    if (!session) {
      return NextResponse.json({
        status: "disconnected",
        phoneNumber: phone,
      });
    }

    return NextResponse.json({
      status: session.status,
      phoneNumber: phone,
      pairingCode: session.pairingCode,
      user: session.user,
      connectionAt: session.connectionAt,
      lastError: session.lastError,
    });
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
    await disconnect(phoneNumber);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
