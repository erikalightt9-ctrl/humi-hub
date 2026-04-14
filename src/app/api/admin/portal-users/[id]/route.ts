import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import type { ModuleKey } from "@/lib/modules";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/* ------------------------------------------------------------------ */
/*  PATCH /api/admin/portal-users/[id]                                  */
/*  Update role, permissions, or active status                          */
/* ------------------------------------------------------------------ */
export async function PATCH(request: NextRequest, { params }: Params) {
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

    const { id } = await params;

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

    // Ensure the user belongs to this tenant's organization
    const existing = await prisma.tenantUser.findFirst({
      where: { id, organizationId: org.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, data: null, error: "User not found" },
        { status: 404 },
      );
    }

    const body = await request.json() as {
      roleLabel?:   string;
      permissions?: ModuleKey[];
      isActive?:    boolean;
    };

    const updateData: {
      roleLabel?:   string;
      permissions?: string[];
      isActive?:    boolean;
      updatedAt:    Date;
    } = { updatedAt: new Date() };

    if (body.roleLabel !== undefined)   updateData.roleLabel   = body.roleLabel.trim() || "User";
    if (body.permissions !== undefined) updateData.permissions = body.permissions;
    if (body.isActive !== undefined)    updateData.isActive    = body.isActive;

    const updated = await prisma.tenantUser.update({
      where: { id },
      data:  updateData,
      select: {
        id:                 true,
        name:               true,
        email:              true,
        roleLabel:          true,
        permissions:        true,
        isActive:           true,
        mustChangePassword: true,
        createdAt:          true,
      },
    });

    return NextResponse.json({ success: true, data: { user: updated }, error: null });
  } catch (err) {
    console.error("[portal-users PATCH]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Failed to update portal user" },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE /api/admin/portal-users/[id]                                 */
/*  Hard-delete the portal user record                                  */
/* ------------------------------------------------------------------ */
export async function DELETE(request: NextRequest, { params }: Params) {
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

    const { id } = await params;

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

    const existing = await prisma.tenantUser.findFirst({
      where: { id, organizationId: org.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, data: null, error: "User not found" },
        { status: 404 },
      );
    }

    await prisma.tenantUser.delete({ where: { id } });

    return NextResponse.json({ success: true, data: null, error: null });
  } catch (err) {
    console.error("[portal-users DELETE]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Failed to delete portal user" },
      { status: 500 },
    );
  }
}
