/**
 * WhatsApp Connection Manager — Baileys (pairing-code mode)
 *
 * In-memory session cache keyed by phone number.
 * Each user (admin or end-user) gets their own Baileys socket.
 *
 * Use requestPairingCode() to start a new connection + get an 8-digit code.
 * Use getConnection() to retrieve an existing connected socket.
 * Use disconnect() to tear down a session.
 */
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  Browsers,
  type WASocket,
  type AuthenticationCreds,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import { adminDb } from "./firebase-admin";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

interface SessionState {
  sock: WASocket;
  status: "connecting" | "open" | "closed" | "error";
  pairingCode?: string;
  phoneNumber?: string;
  connectionAt: number;
  lastError?: string;
  user?: { id: string; name?: string };
}

// in-memory cache
const sessions = new Map<string, SessionState>();

// tmp auth state directory per phone
function authDir(phone: string) {
  const dir = path.join(os.tmpdir(), "replyos_wa", phone);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Start a new Baileys session and request a pairing code.
 * Returns the 8-digit code that the user enters on their phone.
 *
 * Will throw if a session already exists for this phone and is still connecting.
 */
export async function requestPairingCode(phoneNumber: string): Promise<string> {
  // normalize phone (strip +, spaces, dashes)
  const phone = phoneNumber.replace(/[^\d]/g, "");

  // if already connected, return cached code or skip
  const existing = sessions.get(phone);
  if (existing && existing.status === "open") {
    throw new Error("ALREADY_CONNECTED");
  }
  if (existing && existing.status === "connecting" && existing.pairingCode) {
    return existing.pairingCode;
  }

  const { state, saveCreds } = await useMultiFileAuthState(authDir(phone));

  const sock = makeWASocket({
    auth: state as { creds: AuthenticationCreds; keys: unknown },
    browser: Browsers.macOS("Desktop"),
    printQRInTerminal: false,
    generateHighQualityLinkPreview: false,
    markOnlineOnConnect: false,
    syncFullHistory: false,
  });

  const sessionState: SessionState = {
    sock,
    status: "connecting",
    phoneNumber: phone,
    connectionAt: Date.now(),
  };
  sessions.set(phone, sessionState);

  // Save credentials whenever updated
  sock.ev.on("creds.update", saveCreds);

  // Connection events
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (connection === "open") {
      sessionState.status = "open";
      sessionState.user = {
        id: sock.user?.id || "",
        name: sock.user?.name || sock.user?.verifiedName,
      };
      // Persist connection state to Firebase
      try {
        const db = adminDb();
        await db.ref(`whatsappConnections/${phone}`).update({
          status: "connected",
          connectedAt: Date.now(),
          userId: sessionState.user.id,
          name: sessionState.user.name || null,
          pairingCode: null,
        });
      } catch {
        // best-effort
      }
    } else if (connection === "close") {
      const shouldReconnect =
        (lastDisconnect?.error as Boom)?.output?.statusCode !==
        DisconnectReason.loggedOut;
      sessionState.status = "closed";
      sessionState.lastError = lastDisconnect?.error?.message;
      if (shouldReconnect) {
        // auto-reconnect once
        setTimeout(() => {
          sessions.delete(phone);
          requestPairingCode(phone).catch(() => {});
        }, 2000);
      } else {
        // logged out — clean up auth state
        try {
          fs.rmSync(authDir(phone), { recursive: true, force: true });
        } catch {
          // ignore
        }
        sessions.delete(phone);
        try {
          const db = adminDb();
          db.ref(`whatsappConnections/${phone}`).update({
            status: "logged_out",
            disconnectedAt: Date.now(),
          });
        } catch {
          // best-effort
        }
      }
    }

    // We don't use QR, but log if it ever shows up
    if (qr) {
      console.log("[WhatsApp] Got QR — but we requested pairing code, ignoring");
    }
  });

  // Request pairing code (must be requested AFTER socket starts connecting)
  // Baileys docs: requestPairingCode should be called when connection is connecting
  const code = await new Promise<string>((resolve, reject) => {
    let settled = false;
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error("Pairing code timeout"));
      }
    }, 30000);

    sock.ev.on("connection.update", async (update) => {
      if (update.connection === "connecting" && !sessionState.pairingCode) {
        try {
          const code = await sock.requestPairingCode(phone);
          if (!settled && code) {
            settled = true;
            clearTimeout(timeout);
            sessionState.pairingCode = code;
            // Persist code to Firebase for the user
            try {
              const db = adminDb();
              await db.ref(`whatsappConnections/${phone}`).update({
                status: "pairing",
                pairingCode: code,
                requestedAt: Date.now(),
              });
            } catch {
              // best-effort
            }
            resolve(code);
          }
        } catch (err) {
          if (!settled) {
            settled = true;
            clearTimeout(timeout);
            reject(err instanceof Error ? err : new Error("Pairing failed"));
          }
        }
      }
    });
  });

  return code;
}

export function getConnection(phone: string): SessionState | undefined {
  return sessions.get(phone.replace(/[^\d]/g, ""));
}

export function listSessions(): SessionState[] {
  return Array.from(sessions.values());
}

export async function disconnect(phone: string): Promise<void> {
  const p = phone.replace(/[^\d]/g, "");
  const s = sessions.get(p);
  if (s) {
    try {
      await s.sock.logout();
    } catch {
      // ignore
    }
    sessions.delete(p);
  }
  try {
    fs.rmSync(authDir(p), { recursive: true, force: true });
  } catch {
    // ignore
  }
  try {
    const db = adminDb();
    await db.ref(`whatsappConnections/${p}`).update({
      status: "disconnected",
      disconnectedAt: Date.now(),
    });
  } catch {
    // best-effort
  }
}

/**
 * Send a text message via an existing Baileys connection.
 */
export async function sendTextMessage(
  phone: string,
  to: string,
  text: string
): Promise<string> {
  const session = getConnection(phone);
  if (!session || session.status !== "open") {
    throw new Error("WhatsApp session not connected");
  }
  // normalize recipient: ensure @s.whatsapp.net suffix
  const jid = to.replace(/[^\d]/g, "");
  const recipient = jid.includes("@") ? jid : `${jid}@s.whatsapp.net`;
  const sent = await session.sock.sendMessage(recipient, { text });
  return sent?.key?.id || `out_${Date.now()}`;
}
