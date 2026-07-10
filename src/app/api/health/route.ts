import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const diagnostics: Record<string, unknown> = {
    ok: true,
    timestamp: Date.now(),
    node: typeof process !== "undefined" ? process.version : "unknown",
    env: {
      hasFirebaseServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT,
      firebaseServiceAccountLength: process.env.FIREBASE_SERVICE_ACCOUNT?.length ?? 0,
      hasDbUrl: !!process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      dbUrl: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || null,
      hasAdminEmail: !!process.env.ADMIN_BOOTSTRAP_EMAIL,
      hasAdminPass: !!process.env.ADMIN_BOOTSTRAP_PASSWORD,
    },
  };

  // Try to import firebase-admin and report any error
  try {
    const mod = await import("@/lib/firebase-admin");
    diagnostics.firebaseAdminImport = "ok";
    try {
      const app = mod.getAdminApp();
      diagnostics.firebaseApp = {
        name: app.name,
        options: Object.keys((app.options as any) || {}),
      };
    } catch (err) {
      diagnostics.firebaseAppError = err instanceof Error ? err.message : String(err);
      diagnostics.firebaseAppStack = err instanceof Error ? err.stack : null;
    }
  } catch (err) {
    diagnostics.firebaseAdminImport = "failed";
    diagnostics.importError = err instanceof Error ? err.message : String(err);
    diagnostics.importStack = err instanceof Error ? err.stack : null;
  }

  return NextResponse.json(diagnostics);
}
