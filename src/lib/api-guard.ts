/**
 * Admin route guard - verifies admin session before allowing API access.
 * Use in every /api/admin/* route.
 */
import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";

export async function requireAdmin(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized", code: "NO_SESSION" },
      { status: 401 }
    );
  }
  return null;
}

export async function withAdmin(
  handler: (req: NextRequest, ctx?: { params: Record<string, string | string[]> | undefined }) => Promise<NextResponse>
) {
  return async (req: NextRequest, ctx?: { params: Record<string, string | string[]> | undefined }) => {
    const guard = await requireAdmin(req);
    if (guard) return guard;
    return handler(req, ctx);
  };
}
