import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { createId } from "@paralleldrive/cuid2";
import { emptyPermissions } from "@/lib/role-permissions";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/*  GET /api/admin/roles                                                */
/*  List all roles for the current tenant's organization               */
/* ------------------------------------------------------------------ */
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    if (!guard.tenantId) {
      return NextResponse.json(
        { success: false, data: null, error: "Tenant context required" },
        { status: 403 },
      );
    }

    const org = await prisma.organization.findFirst({
      where: { tenantId: guard.tenantId },
      select: { id: true },
    });

    if (!org) {
      return NextResponse.json(
        { success: false, data: null, error: "Organization not found" },
        { status: 404 },
      );
    }

    const roles = await prisma.tenantRole.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: "asc" },
      include: {
        _count: { select: { users: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: { roles },
      error: null,
    });
  } catch (err) {
    console.error("[roles GET]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Failed to fetch roles" },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/admin/roles                                               */
/*  Create a new role                                                   */
/* ------------------------------------------------------------------ */
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    if (!guard.tenantId) {
      return NextResponse.json(
        { success: false, data: null, error: "Tenant context required" },
        { status: 403 },
      );
    }

    const org = await prisma.organization.findFirst({
      where: { tenantId: guard.tenantId },
      select: { id: true },
    });

    if (!org) {
      return NextResponse.json(
        { success: false, data: null, error: "Organization not found" },
        { status: 404 },
      );
    }

    const body = await request.json() as {
      name?:        string;
      description?: string;
      permissions?: unknown;
    };

    if (!body.name?.trim()) {
      return NextResponse.json(
        { success: false, data: null, error: "Role name is required" },
        { status: 400 },
      );
    }

    // Check uniqueness
    const existing = await prisma.tenantRole.findUnique({
      where: { organizationId_name: { organizationId: org.id, name: body.name.trim() } },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, data: null, error: "A role with this name already exists" },
        { status: 409 },
      );
    }

    const role = await prisma.tenantRole.create({
      data: {
        id:             createId(),
        organizationId: org.id,
        name:           body.name.trim(),
        description:    body.description?.trim() ?? null,
        permissions:    (body.permissions ?? emptyPermissions()) as object,
      },
      include: {
        _count: { select: { users: true } },
      },
    });

    return NextResponse.json(
      { success: true, data: { role }, error: null },
      { status: 201 },
    );
  } catch (err) {
    console.error("[roles POST]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Failed to create role" },
      { status: 500 },
    );
  }
}
