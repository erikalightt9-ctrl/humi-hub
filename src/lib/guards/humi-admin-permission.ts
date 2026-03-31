import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import type { HumiAdminPermissions } from "@/types/next-auth";

export type HumiAdminPermissionKey = keyof HumiAdminPermissions;

type GuardResult =
  | { authorized: true; adminId: string; permissions: HumiAdminPermissions }
  | { authorized: false; response: NextResponse };

/**
 * Verifies the request is from an authenticated HUMI Admin
 * and optionally checks a specific feature permission.
 * Returns 401 for unauthenticated, 403 for insufficient permissions.
 */
export async function requireHumiAdmin(
  request: NextRequest,
  permission?: HumiAdminPermissionKey
): Promise<GuardResult> {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token || token.isHumiAdmin !== true) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, data: null, error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  const permissions = (token.humiAdminPermissions ?? {}) as HumiAdminPermissions;

  if (permission && !permissions[permission]) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, data: null, error: `Forbidden: requires ${permission} permission` },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    adminId: token.id as string,
    permissions,
  };
}
