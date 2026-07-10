/**
 * Admin: AI Providers API
 * GET   /api/admin/ai-providers   → list all configured providers
 * POST  /api/admin/ai-providers   → create a new provider
 *   body: { name, provider, model, apiKey, endpoint, isActive, isDefault }
 *
 * NOTE: 'model' is a free-form text field (not a dropdown), per product spec.
 *       'apiKey' is stored encrypted-only-via-Firebase-Rules and masked when read back.
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

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard) return guard;

  try {
    const db = adminDb();
    const snap = await db.ref("aiProviders").get();
    const raw = snap.val() || {};
    const arr: Record<string, unknown>[] = Array.isArray(raw)
      ? raw
      : Object.values(raw as Record<string, Record<string, unknown>>);

    // Never expose full API keys to the client — only masked
    const list = arr.map((p) => ({
      id: (p.id as string) || "",
      name: (p.name as string) || "",
      provider: (p.provider as string) || "zai",
      model: (p.model as string) || "",
      isActive: Boolean(p.isActive),
      isDefault: Boolean(p.isDefault),
      apiKeyMasked: maskKey((p.apiKey as string) || ""),
      endpoint: (p.endpoint as string) || "",
      usageThisMonth: (p.usageThisMonth as number) || 0,
      lastUsedAt: (p.lastUsedAt as number) || 0,
      createdAt: (p.createdAt as number) || 0,
    }));

    return NextResponse.json({ providers: list });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard) return guard;

  try {
    const body = await req.json();
    const { name, provider, model, apiKey, endpoint, isActive, isDefault } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Provider name is required" }, { status: 400 });
    }
    if (!model || typeof model !== "string") {
      return NextResponse.json({ error: "Model name is required" }, { status: 400 });
    }

    const db = adminDb();
    const id = `prov_${Date.now()}`;
    const newProvider = {
      id,
      name: String(name),
      provider: String(provider || "zai"),
      model: String(model), // free-form text
      apiKey: String(apiKey || ""),
      endpoint: String(endpoint || "https://api.z.ai/api/paas/v4"),
      isActive: Boolean(isActive),
      isDefault: Boolean(isDefault),
      usageThisMonth: 0,
      createdAt: Date.now(),
    };

    // If making default, unset others first
    if (newProvider.isDefault) {
      const snap = await db.ref("aiProviders").get();
      const raw = snap.val() || {};
      const arr: Record<string, unknown>[] = Array.isArray(raw)
        ? raw
        : Object.values(raw as Record<string, Record<string, unknown>>);
      const updated = arr.map((p) => ({ ...p, isDefault: false }));
      updated.push(newProvider);
      await db.ref("aiProviders").set(updated);
    } else {
      const snap = await db.ref("aiProviders").get();
      const raw = snap.val() || [];
      const arr: Record<string, unknown>[] = Array.isArray(raw)
        ? raw
        : Object.values(raw as Record<string, Record<string, unknown>>);
      arr.push(newProvider);
      await db.ref("aiProviders").set(arr);
    }

    try {
      const logRef = db.ref("logs").push();
      await logRef.set({
        level: "info",
        message: `Admin added AI provider ${newProvider.name} (${newProvider.model})`,
        source: "admin",
        timestamp: Date.now(),
        meta: { providerId: id },
      });
    } catch {
      // best-effort
    }

    return NextResponse.json({
      success: true,
      provider: {
        ...newProvider,
        apiKey: undefined,
        apiKeyMasked: maskKey(newProvider.apiKey),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
