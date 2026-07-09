/**
 * Firebase Admin SDK - used server-side only (API routes)
 * Provides privileged access to Realtime Database, Storage, and Auth verification.
 *
 * Uses namespace import (* as admin) for maximum CJS/ESM compatibility with Next.js 16 + Turbopack.
 */
import * as admin from "firebase-admin";

let adminApp: admin.app.App | null = null;

function parseServiceAccount(): admin.ServiceAccount | undefined {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw || raw.trim() === "") return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "private_key" in parsed) {
      if (typeof parsed.private_key === "string") {
        // Restore real newlines (env vars often escape them)
        parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
      }
      return parsed as admin.ServiceAccount;
    }
    console.error("[Firebase Admin] Service account JSON missing private_key");
    return undefined;
  } catch (err) {
    console.error("[Firebase Admin] Invalid FIREBASE_SERVICE_ACCOUNT JSON:", err);
    return undefined;
  }
}

function getAdminApp(): admin.app.App {
  if (adminApp) return adminApp;

  // Defensive: getApps() should always return an array, but guard anyway
  let apps: admin.app.App[] = [];
  try {
    const maybeApps = (admin as any).getApps ? (admin as any).getApps() : undefined;
    if (Array.isArray(maybeApps)) apps = maybeApps;
  } catch {
    apps = [];
  }
  if (apps.length > 0) {
    adminApp = apps[0]!;
    return adminApp;
  }

  const serviceAccount = parseServiceAccount();
  const credential = serviceAccount
    ? (admin as any).cert(serviceAccount)
    : (admin as any).applicationDefault();

  adminApp = (admin as any).initializeApp({
    credential,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });

  return adminApp;
}

// Lazy accessors — only call database()/auth()/storage() when actually needed
export function adminDb(): admin.database.Database {
  return (getAdminApp() as any).database();
}
export function adminAuth(): admin.auth.Auth {
  return (getAdminApp() as any).auth();
}
export function adminStorage(): admin.storage.Storage {
  return (getAdminApp() as any).storage();
}
export { getAdminApp };
export default getAdminApp;
