/**
 * Send a message via WhatsApp
 * - If accessToken === "baileys", route through the Baileys connection for that phone.
 * - Otherwise, use the WhatsApp Cloud API with the given phoneNumberId + accessToken.
 */
import { NextRequest, NextResponse } from "next/server";
import { sendTextMessage } from "@/lib/whatsapp-baileys";

export async function POST(req: NextRequest) {
  try {
    const { to, message, phoneNumberId, accessToken } = await req.json();

    if (!to || !message) {
      return NextResponse.json(
        { error: "Recipient and message are required" },
        { status: 400 }
      );
    }

    // Baileys path
    if (accessToken === "baileys" && phoneNumberId) {
      try {
        const msgId = await sendTextMessage(phoneNumberId, to, message);
        return NextResponse.json({ success: true, messageId: msgId });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Baileys send failed";
        return NextResponse.json({ error: msg }, { status: 500 });
      }
    }

    // WhatsApp Cloud API path
    if (!phoneNumberId || !accessToken) {
      return NextResponse.json(
        { error: "WhatsApp credentials not configured" },
        { status: 400 }
      );
    }

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

    return NextResponse.json({ success: true, messageId: data.messages?.[0]?.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
