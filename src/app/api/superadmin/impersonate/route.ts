import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireSuperAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { SignJWT } from "jose";

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireSuperAdmin(token);
    if (!guard.ok) return guard.response;

    const body = await req.json();
    const tenantId = typeof body?.tenantId === "string" ? body.tenantId : null;
    if (!tenantId) {
      return NextResponse.json(
        { success: false, data: null, error: "tenantId is required" },
        { status: 422 }
      );
    }

    const tenant = await prisma.organization.findUnique({
      where: { id: tenantId },
      include: {
        managers: { take: 1, orderBy: { createdAt: "asc" } },
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, data: null, error: "Tenant not found" },
        { status: 404 }
      );
    }

    const secret = process.env.NEXTAUTH_SECRET ?? "fallback-secret";
    const superAdminEmail = token?.email as string | undefined;

    const encoder = new TextEncoder();
    const secretKey = encoder.encode(secret);

    const impersonationToken = await new SignJWT({
      type: "impersonation",
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      superAdminEmail: superAdminEmail ?? null,
      managerId: tenant.managers[0]?.id ?? null,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("30m")
      .sign(secretKey);

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const url = `${baseUrl}/superadmin/tenants/${tenant.id}`;

    return NextResponse.json({
      success: true,
      data: { url, impersonationToken, tenantName: tenant.name },
      error: null,
    });
  } catch (err) {
    console.error("[POST /api/superadmin/impersonate]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
