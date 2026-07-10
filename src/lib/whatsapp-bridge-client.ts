/**
 * WhatsApp Bridge Client — talks to the remote ReplyOS WhatsApp Bridge
 * running on the VPS (e.g. http://13.60.186.223).
 *
 * The remote bridge exposes:
 *   GET    /health
 *   POST   /connect      body: { phone }                     → { pairingCode, status, ... }
 *   GET    /status?phone=...                                  → { state, status, ... }
 *   POST   /send-message  body: { phone, to, text }           → { success, messageId }
 *   POST   /disconnect    body: { phone }                     → { success }
 *   GET    /sessions                                         → { sessions: [...] }
 *
 * Auth: Authorization: Bearer <WHATSAPP_BRIDGE_API_KEY>
 *
 * Configure via env:
 *   WHATSAPP_BRIDGE_URL       e.g. http://13.60.186.223
 *   WHATSAPP_BRIDGE_API_KEY   e.g. replyos-xxxxxxxxxxxx
 */

export interface BridgeSession {
  phone: string;
  status: "connecting" | "open" | "closed" | "disconnected";
  pairingCode?: string;
  user?: { id: string; name?: string };
  connectionAt?: number;
  lastError?: string;
}

export interface BridgePairingResponse {
  success: boolean;
  pairingCode?: string;
  status: "pairing" | "open" | "connecting";
  state?: string;
  phoneNumber?: string;
  instructions?: string;
  message?: string;
}

export interface BridgeStatusResponse {
  state: "disconnected" | "connecting" | "open" | "closed";
  status?: string;
  phoneNumber?: string;
  pairingCode?: string;
  user?: { id: string; name?: string };
  connectionAt?: number;
  lastError?: string;
}

export interface BridgeSessionsResponse {
  sessions: BridgeSession[];
}

function bridgeUrl(): string {
  const url = process.env.WHATSAPP_BRIDGE_URL || "";
  if (!url) {
    throw new Error("WHATSAPP_BRIDGE_URL is not configured");
  }
  return url.replace(/\/$/, "");
}

function bridgeApiKey(): string {
  const key = process.env.WHATSAPP_BRIDGE_API_KEY || "";
  if (!key) {
    throw new Error("WHATSAPP_BRIDGE_API_KEY is not configured");
  }
  return key;
}

function authHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${bridgeApiKey()}`,
    "Content-Type": "application/json",
  };
}

/**
 * Health check — verify the bridge is alive.
 */
export async function bridgeHealth(): Promise<{
  ok: boolean;
  uptime?: number;
  sessions?: number;
  url: string;
}> {
  try {
    const url = bridgeUrl();
    const res = await fetch(`${url}/health`, {
      headers: { Authorization: `Bearer ${bridgeApiKey()}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      return { ok: false, url };
    }
    const data = await res.json();
    return {
      ok: true,
      uptime: data.uptime,
      sessions: data.sessions,
      url,
    };
  } catch (err) {
    return {
      ok: false,
      url: process.env.WHATSAPP_BRIDGE_URL || "",
    };
  }
}

/**
 * Normalize a phone number: strip everything except digits.
 */
function normalizePhone(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

/**
 * Request a pairing code from the bridge.
 */
export async function bridgeRequestPairing(
  phoneNumber: string
): Promise<BridgePairingResponse> {
  const phone = normalizePhone(phoneNumber);
  if (phone.length < 8) {
    throw new Error("Invalid phone number (must be at least 8 digits)");
  }
  const res = await fetch(`${bridgeUrl()}/connect`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ phone }),
    cache: "no-store",
    signal: AbortSignal.timeout(60_000),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Bridge error: ${res.status}`);
  }
  return data as BridgePairingResponse;
}

/**
 * Get connection status for a phone number.
 */
export async function bridgeGetStatus(
  phoneNumber: string
): Promise<BridgeStatusResponse> {
  const phone = normalizePhone(phoneNumber);
  const res = await fetch(`${bridgeUrl()}/status?phone=${phone}`, {
    headers: { Authorization: `Bearer ${bridgeApiKey()}` },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Bridge error: ${res.status}`);
  }
  return res.json();
}

/**
 * Send a text message via the bridge.
 */
export async function bridgeSendMessage(
  phoneNumber: string,
  to: string,
  text: string
): Promise<{ success: boolean; messageId?: string }> {
  const phone = normalizePhone(phoneNumber);
  const res = await fetch(`${bridgeUrl()}/send-message`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ phone, to, text }),
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Bridge error: ${res.status}`);
  }
  return data;
}

/**
 * Disconnect a session.
 */
export async function bridgeDisconnect(
  phoneNumber: string
): Promise<{ success: boolean }> {
  const phone = normalizePhone(phoneNumber);
  const res = await fetch(`${bridgeUrl()}/disconnect`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ phone }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Bridge error: ${res.status}`);
  }
  return data;
}

/**
 * List all sessions currently active on the bridge.
 */
export async function bridgeListSessions(): Promise<BridgeSession[]> {
  const res = await fetch(`${bridgeUrl()}/sessions`, {
    headers: { Authorization: `Bearer ${bridgeApiKey()}` },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Bridge error: ${res.status}`);
  }
  const data = (await res.json()) as BridgeSessionsResponse;
  return data.sessions || [];
}
