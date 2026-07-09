/**
 * WhatsApp Business Cloud API Webhook endpoint
 * Receives incoming messages and status updates from WhatsApp.
 *
 * Setup in Meta Business:
 *   Webhook URL: https://replyos-1.vercel.app/api/whatsapp/webhook
 *   Verify Token: 2222Tikzoombot+ (set via WHATSAPP_VERIFY_TOKEN env var)
 *
 * Meta docs: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples
 */
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET - Webhook verification handshake.
 * Meta calls this when you click "Verify and Save" in the dashboard.
 * It sends:
 *   - hub.mode=subscribe
 *   - hub.verify_token=<your token>
 *   - hub.challenge=<random string to echo back>
 * We must echo back the challenge exactly to confirm ownership.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "";

  console.log("[WhatsApp Webhook GET]", { mode, token, challenge, hasToken: !!verifyToken });

  // Meta requires: mode=subscribe AND token matches exactly
  if (mode === "subscribe" && token && verifyToken && token === verifyToken) {
    // Must return challenge as plain text (NOT JSON)
    return new NextResponse(challenge || "", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  console.warn("[WhatsApp Webhook GET] Verification FAILED", {
    modeReceived: mode,
    tokenReceived: token ? "***" : null,
    expectedTokenSet: !!verifyToken,
  });

  return new NextResponse("Forbidden", { status: 403 });
}

/**
 * POST - Incoming message / status webhook.
 * Meta sends here whenever a customer messages the WhatsApp Business number
 * or when a message status changes (sent, delivered, read).
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();

    // Always ack Meta quickly — must return 200 within ~5 seconds
    // Logging for debugging
    console.log("[WhatsApp Webhook POST]", JSON.stringify(body).slice(0, 800));

    if (!body?.object) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Iterate through all entries (batched webhook delivery)
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        await processChange(change);
      }
    }

    return NextResponse.json({ success: true, ms: Date.now() - startTime });
  } catch (err) {
    console.error("[WhatsApp Webhook POST Error]", err);
    // Still return 200 so Meta doesn't retry
    return NextResponse.json({ success: false, error: "processing_error" });
  }
}

interface WhatsAppChange {
  field: string;
  value: {
    messaging_product?: string;
    metadata?: { phone_number_id: string; display_phone_number: string };
    contacts?: Array<{ wa_id: string; profile?: { name: string } }>;
    messages?: Array<{
      id: string;
      from: string;
      type: string;
      timestamp: string;
      text?: { body: string };
      button?: { text: string };
      interactive?: { type: string; [k: string]: unknown };
      image?: { id: string; mime_type: string; caption?: string };
      audio?: { id: string; mime_type: string };
      document?: { id: string; mime_type: string; filename?: string };
      location?: { latitude: number; longitude: number };
    }>;
    statuses?: Array<{
      id: string;
      status: "sent" | "delivered" | "read" | "failed";
      timestamp: string;
      recipient_id: string;
      errors?: Array<{ code: number; title: string; message: string }>;
    }>;
  };
}

async function processChange(change: WhatsAppChange) {
  const value = change.value;

  // ----- Handle status updates (sent / delivered / read / failed) -----
  if (value.statuses && value.statuses.length > 0) {
    for (const status of value.statuses) {
      await persistStatus(status, value.metadata?.phone_number_id);
    }
    return;
  }

  // ----- Handle incoming messages -----
  if (!value.messages || value.messages.length === 0) return;

  const phoneNumberId = value.metadata?.phone_number_id || process.env.WHATSAPP_PHONE_NUMBER_ID;
  const contactProfile = value.contacts?.[0]?.profile?.name || "Unknown";

  for (const msg of value.messages) {
    const text = extractText(msg);
    await persistIncomingMessage(msg, contactProfile, text);

    // Generate and send AI reply (best-effort, non-blocking on failure)
    if (text) {
      try {
        await sendAutoReply(msg.from, text, phoneNumberId);
      } catch (err) {
        console.error("[WhatsApp Webhook] sendAutoReply failed:", err);
      }
    }
  }
}

function extractText(msg: WhatsAppChange["value"]["messages"][number]): string {
  switch (msg.type) {
    case "text":
      return msg.text?.body || "";
    case "button":
      return msg.button?.text || "";
    case "interactive":
      return JSON.stringify(msg.interactive);
    case "image":
      return msg.image?.caption || "[image]";
    case "audio":
      return "[audio]";
    case "document":
      return `[document: ${msg.document?.filename || ""}]`;
    case "location":
      return `[location: ${msg.location?.latitude},${msg.location?.longitude}]`;
    default:
      return `[${msg.type}]`;
  }
}

async function persistIncomingMessage(
  msg: WhatsAppChange["value"]["messages"][number],
  contactName: string,
  text: string,
) {
  try {
    const { adminDb } = await import("@/lib/firebase-admin");
    const db = adminDb();
    await db.ref(`whatsapp/messages/${msg.from}/${msg.id}`).set({
      from: msg.from,
      contactName,
      text,
      type: msg.type,
      timestamp: Number(msg.timestamp) * 1000,
      messageId: msg.id,
      direction: "inbound",
      processed: false,
      receivedAt: Date.now(),
    });
    // Update conversation preview
    await db.ref(`whatsapp/conversations/${msg.from}`).update({
      lastMessage: text,
      lastMessageAt: Date.now(),
      contactName,
      lastDirection: "inbound",
    });
  } catch (err) {
    console.warn("[WhatsApp Webhook] Firebase persist failed:", err);
  }
}

async function persistStatus(
  status: WhatsAppChange["value"]["statuses"][number],
  phoneNumberId?: string,
) {
  try {
    const { adminDb } = await import("@/lib/firebase-admin");
    const db = adminDb();
    await db.ref(`whatsapp/statuses/${status.id}`).update({
      status: status.status,
      recipientId: status.recipient_id,
      timestamp: Number(status.timestamp) * 1000,
      phoneNumberId,
      errors: status.errors || null,
      updatedAt: Date.now(),
    });
  } catch (err) {
    console.warn("[WhatsApp Webhook] status persist failed:", err);
  }
}

/**
 * Send an auto-reply back to the customer.
 * For now: a simple echo + acknowledgment. Will be wired to AI provider
 * (Z.ai GLM) and per-user rules in a follow-up.
 */
async function sendAutoReply(to: string, incomingText: string, phoneNumberId?: string) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const pid = phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_API_VERSION || "v21.0";

  if (!token || !pid) {
    console.warn("[WhatsApp Webhook] Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID");
    return;
  }

  // Placeholder reply — will be replaced with AI-generated response
  const replyText = `شكرًا لرسالتك! تم استلامها بنجاح. فريق ReplyOS سيرد عليك قريبًا.\n\nرسالتك: "${incomingText.slice(0, 100)}"`;

  const res = await fetch(`https://graph.facebook.com/${apiVersion}/${pid}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { body: replyText, preview_url: false },
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("[WhatsApp Webhook] send reply failed:", data);
    return;
  }

  // Persist outbound message
  try {
    const { adminDb } = await import("@/lib/firebase-admin");
    const db = adminDb();
    const msgId = data.messages?.[0]?.id || `out_${Date.now()}`;
    await db.ref(`whatsapp/messages/${to}/${msgId}`).set({
      to,
      text: replyText,
      type: "text",
      timestamp: Date.now(),
      messageId: msgId,
      direction: "outbound",
      processed: true,
      sentAt: Date.now(),
    });
    await db.ref(`whatsapp/conversations/${to}`).update({
      lastMessage: replyText,
      lastMessageAt: Date.now(),
      lastDirection: "outbound",
    });
  } catch (err) {
    console.warn("[WhatsApp Webhook] outbound persist failed:", err);
  }

  console.log("[WhatsApp Webhook] Auto-reply sent to", to, "msgId:", data.messages?.[0]?.id);
}
