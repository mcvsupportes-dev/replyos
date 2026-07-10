/**
 * Admin: App Settings API
 * GET   /api/admin/settings   → read app settings
 * PATCH /api/admin/settings   body: partial settings fields
 */
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/api-guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULT_SETTINGS = {
  appName: "ReplyOS",
  defaultLanguage: "ar",
  defaultTheme: "light",
  maintenanceMode: false,
  signupEnabled: true,
};

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard) return guard;

  try {
    const db = adminDb();
    const snap = await db.ref("settings/app").get();
    const settings = snap.val() || DEFAULT_SETTINGS;
    return NextResponse.json({ settings: { ...DEFAULT_SETTINGS, ...settings } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard) return guard;

  try {
    const body = await req.json();
    const db = adminDb();

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    for (const k of [
      "appName",
      "defaultLanguage",
      "defaultTheme",
      "maintenanceMode",
      "signupEnabled",
      "supportEmail",
      "whatsappSupportNumber",
      "brandColor",
      "brandLogoUrl",
    ]) {
      if (body[k] !== undefined) updates[k] = body[k];
    }

    await db.ref("settings/app").update(updates);

    try {
      const logRef = db.ref("logs").push();
      await logRef.set({
        level: "info",
        message: "Admin updated app settings",
        source: "admin",
        timestamp: Date.now(),
        meta: { fields: Object.keys(updates) },
      });
    } catch {
      // best-effort
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
