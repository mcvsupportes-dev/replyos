/**
 * Admin: Per-provider mutations
 * PATCH  /api/admin/ai-providers/[id]   body: partial provider fields (apiKey, model, endpoint, isActive, isDefault, name)
 * DELETE /api/admin/ai-providers/[id]
 */
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/api-guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function maskKey(key: string): string {
  if (!key) return "••••••••";
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 4)}••••••••${key.slice(-4)}`;
}

async function readProviders(
  db: ReturnType<typeof adminDb>
): Promise<Record<string, unknown>[]> {
  const snap = await db.ref("aiProviders").get();
  const raw = snap.val() || [];
  return Array.isArray(raw) ? raw : Object.values(raw as Record<string, Record<string, unknown>>);
}

async function writeProviders(
  db: ReturnType<typeof adminDb>,
  arr: Record<string, unknown>[]
) {
  await db.ref("aiProviders").set(arr);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin(req);
  if (guard) return guard;

  try {
    const { id } = await params;
    const body = await req.json();
    const db = adminDb();

    const providers = await readProviders(db);
    const idx = providers.findIndex((p) => p.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    const updated: Record<string, unknown> = { ...providers[idx], updatedAt: Date.now() };
    for (const k of ["name", "provider", "model", "apiKey", "endpoint"]) {
      if (body[k] !== undefined) updated[k] = String(body[k]);
    }
    for (const k of ["isActive", "isDefault"]) {
      if (body[k] !== undefined) updated[k] = Boolean(body[k]);
    }

    // If making default, unset others
    if (updated.isDefault === true) {
      for (let i = 0; i < providers.length; i++) {
        if (i !== idx) providers[i].isDefault = false;
      }
    }

    providers[idx] = updated;
    await writeProviders(db, providers);

    return NextResponse.json({
      success: true,
      provider: { ...updated, apiKey: undefined, apiKeyMasked: maskKey((updated.apiKey as string) || "") },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin(req);
  if (guard) return guard;

  try {
    const { id } = await params;
    const db = adminDb();
    const providers = await readProviders(db);
    const filtered = providers.filter((p) => p.id !== id);
    if (filtered.length === providers.length) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }
    await writeProviders(db, filtered);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
