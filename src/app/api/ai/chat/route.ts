import { NextRequest, NextResponse } from "next/server";
import { chat, type ChatMessage } from "@/lib/ai-provider";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const { messages, tone, length, providerId, userId } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // If a custom provider is specified, load its config
    let providerConfig: { provider: string; apiKey: string; baseUrl: string; model: string } | undefined;
    if (providerId && userId) {
      try {
        const db = adminDb();
        const snap = await db.ref(`customApiKeys/${userId}/${providerId}`).get();
        const config = snap.val();
        if (config) {
          providerConfig = {
            provider: config.provider,
            apiKey: config.apiKey,
            baseUrl: config.endpoint,
            model: config.model,
          };
        }
      } catch {
        // Firebase not available — use default
      }
    }

    const result = await chat(
      messages as ChatMessage[],
      { tone, length },
      providerConfig
    );

    // Log usage (best-effort)
    try {
      const db = adminDb();
      const today = new Date().toISOString().split("T")[0];
      await db.ref(`analytics/daily/${today}/${userId || "anon"}`).transaction((current) => ({
        replies: (current?.replies || 0) + 1,
        messages: (current?.messages || 0) + (messages.length),
        lastReply: Date.now(),
      }));
    } catch {
      // Best-effort logging
    }

    return NextResponse.json({
      content: result.content,
      provider: result.provider,
      model: result.model,
      usage: result.usage,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
