import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const range = (searchParams.get("range") as "daily" | "weekly" | "monthly") || "weekly";
    const userId = searchParams.get("userId") || "all";

    // Generate date range
    const days = range === "daily" ? 1 : range === "weekly" ? 7 : 30;
    const data: Array<{ date: string; replies: number; messages: number }> = [];

    let firebaseData: Record<string, unknown> = {};
    try {
      const db = adminDb();
      const snap = await db.ref("analytics/daily").get();
      firebaseData = snap.val() || {};
    } catch {
      // Firebase not available
    }

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      let replies = 0;
      let messages = 0;

      const dayData = (firebaseData as Record<string, Record<string, { replies?: number; messages?: number }>>)[dateStr];
      if (dayData) {
        for (const uid in dayData) {
          if (userId === "all" || uid === userId) {
            replies += dayData[uid]?.replies || 0;
            messages += dayData[uid]?.messages || 0;
          }
        }
      }

      // No fallback to fake data — return zeros if no real data exists
      // (This was previously returning random demo numbers, which was misleading.)

      data.push({ date: dateStr, replies, messages });
    }

    const totalReplies = data.reduce((s, d) => s + d.replies, 0);
    const totalMessages = data.reduce((s, d) => s + d.messages, 0);

    return NextResponse.json({
      range,
      data,
      totals: {
        replies: totalReplies,
        messages: totalMessages,
        avgRepliesPerDay: Math.round(totalReplies / days),
        avgMessagesPerDay: Math.round(totalMessages / days),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
