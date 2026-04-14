import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { createId } from "@paralleldrive/cuid2";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

async function resolveOrgForAdmin(token: ReturnType<typeof getToken> extends Promise<infer T> ? T : never) {
  if (!token || typeof (token as { tenantId?: unknown }).tenantId !== "string") return null;
  return prisma.organization.findFirst({
    where: { tenantId: (token as { tenantId: string }).tenantId },
    select: { id: true },
  });
}

/* ------------------------------------------------------------------ */
/*  GET /api/admin/roles/[id]                                           */
/* ------------------------------------------------------------------ */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { id } = await params;
    const org = await resolveOrgForAdmin(token);
    if (!org) {
      return NextResponse.json(
        { success: false, data: null, error: "Organization not found" },
        { status: 404 },
      );
    }

    const role = await prisma.tenantRole.findFirst({
      where: { id, organizationId: org.id },
      include: { _count: { select: { users: true } } },
    });

    if (!role) {
      return NextResponse.json(
        { success: false, data: null, error: "Role not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: { role }, error: null });
  } catch (err) {
    console.error("[roles/[id] GET]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Failed to fetch role" },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  PATCH /api/admin/roles/[id]                                         */
/*  Update name, description, permissions; or "action: duplicate"      */
/* ------------------------------------------------------------------ */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { id } = await params;
    const org = await resolveOrgForAdmin(token);
    if (!org) {
      return NextResponse.json(
        { success: false, data: null, error: "Organization not found" },
        { status: 404 },
      );
    }

    const existing = await prisma.tenantRole.findFirst({
      where: { id, organizationId: org.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, data: null, error: "Role not found" },
        { status: 404 },
      );
    }

    const body = await request.json() as {
      action?:      "duplicate";
      name?:        string;
      description?: string;
      permissions?: unknown;
    };

    // --- Duplicate action ---
    if (body.action === "duplicate") {
      const copyName = `${existing.name} (Copy)`;
      const duplicate = await prisma.tenantRole.create({
        data: {
          id:             createId(),
          organizationId: org.id,
          name:           copyName,
          description:    existing.description,
          permissions:    existing.permissions as object,
        },
        include: { _count: { select: { users: true } } },
      });
      return NextResponse.json(
        { success: true, data: { role: duplicate }, error: null },
        { status: 201 },
      );
    }

    // --- Normal update ---
    type UpdateData = {
      updatedAt:    Date;
      name?:        string;
      description?: string | null;
      permissions?: object;
    };

    const updateData: UpdateData = { updatedAt: new Date() };

    if (body.name !== undefined) {
      if (!body.name.trim()) {
        return NextResponse.json(
          { success: false, data: null, error: "Role name cannot be empty" },
          { status: 400 },
        );
      }
      updateData.name = body.name.trim();
    }

    if ("description" in body) {
      updateData.description = body.description?.trim() ?? null;
    }

    if (body.permissions !== undefined) {
      updateData.permissions = body.permissions as object;
    }

    const updated = await prisma.tenantRole.update({
      where: { id },
      data:  updateData,
      include: { _count: { select: { users: true } } },
    });

    return NextResponse.json({ success: true, data: { role: updated }, error: null });
  } catch (err) {
    console.error("[roles/[id] PATCH]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Failed to update role" },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE /api/admin/roles/[id]                                        */
/* ------------------------------------------------------------------ */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { id } = await params;
    const org = await resolveOrgForAdmin(token);
    if (!org) {
      return NextResponse.json(
        { success: false, data: null, error: "Organization not found" },
        { status: 404 },
      );
    }

    const existing = await prisma.tenantRole.findFirst({
      where: { id, organizationId: org.id },
      include: { _count: { select: { users: true } } },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, data: null, error: "Role not found" },
        { status: 404 },
      );
    }

    if (existing.isSystem) {
      return NextResponse.json(
        { success: false, data: null, error: "System roles cannot be deleted" },
        { status: 403 },
      );
    }

    if (existing._count.users > 0) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: `This role is assigned to ${existing._count.users} user(s). Reassign them before deleting.`,
        },
        { status: 409 },
      );
    }

    await prisma.tenantRole.delete({ where: { id } });

    return NextResponse.json({ success: true, data: null, error: null });
  } catch (err) {
    console.error("[roles/[id] DELETE]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Failed to delete role" },
      { status: 500 },
    );
  }
}
