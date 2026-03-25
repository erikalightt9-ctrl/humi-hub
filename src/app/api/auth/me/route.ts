/**
 * GET /api/auth/me
 *
 * Returns the currently authenticated user's profile.
 * Works for all authenticated roles: admin, student, trainer, corporate, superadmin.
 */

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id) {
      return NextResponse.json(
        { success: false, data: null, error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: token.id,
        name: token.name,
        email: token.email,
        role: token.role,
        tenantId: token.tenantId ?? null,
        organizationId: token.organizationId ?? null,
        isSuperAdmin: token.isSuperAdmin ?? false,
        isTenantAdmin: token.isTenantAdmin ?? false,
        mustChangePassword: token.mustChangePassword ?? false,
      },
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/auth/me]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
