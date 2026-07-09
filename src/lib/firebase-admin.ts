/**
 * Firebase Admin SDK - used server-side only (API routes)
 * Provides privileged access to Realtime Database, Storage, and Auth verification.
 *
 * NOTE: firebase-admin/auth → jwks-rsa → jose (ESM-only) crashes under Turbopack's
 * CJS interop on Vercel. We therefore lazy-load auth/storage ONLY when actually
 * called. Database (the main use case) loads eagerly and works fine.
 */
import { initializeApp, getApps, cert, applicationDefault, type App } from "firebase-admin/app";
import { getDatabase, type Database } from "firebase-admin/database";

let adminApp: App | null = null;

function parseServiceAccount(): Record<string, unknown> | undefined {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw || raw.trim() === "") return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "private_key" in parsed) {
      if (typeof parsed.private_key === "string") {
        // Restore real newlines (env vars often escape them)
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

  // Defensive: getApps() should always return an array, but guard anyway
  let apps: App[] = [];
  try {
    const maybeApps = typeof getApps === "function" ? getApps() : [];
    if (Array.isArray(maybeApps)) apps = maybeApps;
  } catch {
    apps = [];
  }
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

// Eager database accessor (safe — firebase-admin/database has no ESM-only deps)
export function adminDb(): Database {
  return getDatabase(getAdminApp());
}

// Lazy auth accessor (jwks-rsa/jose only loaded if/when called)
export async function adminAuth(): Promise<import("firebase-admin/auth").Auth> {
  const { getAuth } = await import("firebase-admin/auth");
  return getAuth(getAdminApp());
}

// Lazy storage accessor
export async function adminStorage(): Promise<import("firebase-admin/storage").Storage> {
  const { getStorage } = await import("firebase-admin/storage");
  return getStorage(getAdminApp());
}

export { getAdminApp };
export default getAdminApp;
