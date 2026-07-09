/**
 * Admin auth helpers - session management via httpOnly cookies
 * Uses a simple signed token (JWT-like) stored in a cookie.
 */
import { cookies } from "next/headers";
import { createHmac } from "crypto";

const SESSION_COOKIE = "replyos_admin_session";
const SECRET = process.env.ADMIN_BOOTSTRAP_PASSWORD || "ReplyOS2025!";

export interface AdminSession {
  email: string;
  role: "admin";
  loginAt: number;
}

function sign(data: string): string {
  return createHmac("sha256", SECRET).update(data).digest("hex");
}

export function createSessionToken(session: AdminSession): string {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string): AdminSession | null {
  try {
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return null;
    if (sign(payload) !== sig) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return data as AdminSession;
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function setAdminSession(session: AdminSession) {
  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export async function clearAdminSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export function verifyAdminCredentials(email: string, password: string): boolean {
  const adminEmail = process.env.ADMIN_BOOTSTRAP_EMAIL || "admin@replyos.com";
  const adminPass = process.env.ADMIN_BOOTSTRAP_PASSWORD || "ReplyOS2025!";
  return email === adminEmail && password === adminPass;
}
