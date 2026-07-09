/**
 * Admin: Feature Flags API
 * GET   /api/admin/feature-flags    → list all flags
 * PATCH /api/admin/feature-flags    body: { flags: [{key, enabled}, ...] }  → bulk update
 */
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/api-guard";
import { DEFAULT_FEATURE_FLAGS } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard) return guard;

  try {
    const db = adminDb();
    const snap = await db.ref("featureFlags").get();
    const raw = snap.val();
    let flags: Record<string, unknown>[];
    if (!raw) {
      await db.ref("featureFlags").set(DEFAULT_FEATURE_FLAGS);
      flags = DEFAULT_FEATURE_FLAGS as unknown as Record<string, unknown>[];
    } else if (Array.isArray(raw)) {
      flags = raw as Record<string, unknown>[];
    } else {
      flags = Object.values(raw as Record<string, Record<string, unknown>>);
    }
    return NextResponse.json({ flags });
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

    // body.flags is an array of { key, enabled }
    if (!Array.isArray(body.flags)) {
      return NextResponse.json({ error: "flags array required" }, { status: 400 });
    }

    const snap = await db.ref("featureFlags").get();
    const raw = snap.val() || [];
    const flags: Record<string, unknown>[] = Array.isArray(raw)
      ? raw
      : Object.values(raw as Record<string, Record<string, unknown>>);

    for (const update of body.flags) {
      const idx = flags.findIndex((f) => f.key === update.key);
      if (idx !== -1) {
        flags[idx].enabled = Boolean(update.enabled);
      }
    }

    await db.ref("featureFlags").set(flags);
    return NextResponse.json({ success: true, flags });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
