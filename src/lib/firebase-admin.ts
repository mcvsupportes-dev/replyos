/**
 * Firebase Admin SDK - used server-side only (API routes)
 * Provides privileged access to Realtime Database, Storage, and Auth verification.
 *
 * Uses firebase-admin modular API (v14+):
 *   - getApps() / initializeApp() / cert() / applicationDefault() from 'firebase-admin/app'
 *   - getDatabase(app) from 'firebase-admin/database'
 *   - getAuth(app) from 'firebase-admin/auth'
 *   - getStorage(app) from 'firebase-admin/storage'
 */
import { getApps, initializeApp, cert, applicationDefault, getApps as _getApps, type App } from "firebase-admin/app";
import { getDatabase, type Database } from "firebase-admin/database";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getStorage, type Storage } from "firebase-admin/storage";

let adminApp: App | null = null;

function parseServiceAccount(): Record<string, unknown> | undefined {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw || raw.trim() === "") return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "private_key" in parsed) {
      // Ensure private_key has proper newlines (in case env var escaped them)
      if (typeof parsed.private_key === "string") {
        parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
      }
      return parsed as Record<string, unknown>;
    }
    console.error("[Firebase Admin] Service account JSON missing private_key");
    return undefined;
  } catch (err) {
    console.error("[Firebase Admin] Invalid FIREBASE_SERVICE_ACCOUNT JSON:", err);
    return undefined;
  }
}

function getAdminApp(): App {
  if (adminApp) return adminApp;

  // getApps() always returns an array in firebase-admin v14+
  const apps = (typeof _getApps === "function" ? _getApps() : getApps()) || [];
  if (apps.length > 0) {
    adminApp = apps[0]!;
    return adminApp;
  }

  const serviceAccount = parseServiceAccount();
  const credential = serviceAccount ? cert(serviceAccount as any) : applicationDefault();

  adminApp = initializeApp({
    credential,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });

  return adminApp;
}

export const adminDb = (): Database => getDatabase(getAdminApp());
export const adminAuth = (): Auth => getAuth(getAdminApp());
export const adminStorage = (): Storage => getStorage(getAdminApp());
export { getAdminApp };
export default getAdminApp;
