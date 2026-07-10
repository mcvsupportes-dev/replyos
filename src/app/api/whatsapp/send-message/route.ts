/**
 * Send a message via WhatsApp — routes to the remote bridge.
 * Body: { phoneNumber, to, message }   ← phoneNumber is the connected WhatsApp number,
 *                                         to is the recipient, message is the text.
 *
 * Falls back to WhatsApp Cloud API if { phoneNumberId, accessToken } provided.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-guard";
import { bridgeSendMessage } from "@/lib/whatsapp-bridge-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard) return guard;

  try {
    const body = await req.json();
    const { to, message, phoneNumber, phoneNumberId, accessToken } = body;

    if (!to || !message) {
      return NextResponse.json(
        { error: "Recipient and message are required" },
        { status: 400 }
      );
    }

    // Bridge path (recommended) — phoneNumber is the connected account
    if (phoneNumber) {
      try {
        const result = await bridgeSendMessage(phoneNumber, to, message);

        // Log to Firebase for analytics
        try {
          const { adminDb } = await import("@/lib/firebase-admin");
          const db = adminDb();
          const msgRef = db.ref("messages").push();
          await msgRef.set({
            from: phoneNumber,
            to: String(to).replace(/[^\d]/g, ""),
            text: message,
            messageId: result.messageId || null,
            timestamp: Date.now(),
            direction: "outbound",
            source: "bridge",
          });
        } catch {
          // best-effort
        }

        return NextResponse.json({
          success: true,
          messageId: result.messageId,
          bridge: "remote",
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Bridge send failed";
        return NextResponse.json({ error: msg }, { status: 500 });
      }
    }

    // WhatsApp Cloud API fallback
    if (accessToken && accessToken !== "baileys" && phoneNumberId) {
      const apiVersion = process.env.WHATSAPP_API_VERSION || "v21.0";
      const res = await fetch(
        `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to,
            type: "text",
            text: { body: message },
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        return NextResponse.json(
          { error: data.error?.message || "WhatsApp API error" },
          { status: res.status }
        );
      }
      return NextResponse.json({
        success: true,
        messageId: data.messages?.[0]?.id,
        bridge: "cloud-api",
      });
    }

    return NextResponse.json(
      { error: "Either phoneNumber (bridge) or phoneNumberId+accessToken (cloud API) is required" },
      { status: 400 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
