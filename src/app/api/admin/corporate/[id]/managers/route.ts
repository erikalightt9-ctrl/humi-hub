import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { z } from "zod";

export const dynamic = "force-dynamic";

const editManagerSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  role: z.string().max(50).optional(),
  isActive: z.boolean().optional(),
});

/* ------------------------------------------------------------------ */
/*  PUT — Edit a manager (managerId in query param)                   */
/* ------------------------------------------------------------------ */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const guard = requireAdmin(token);
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const managerId = searchParams.get("managerId");
    if (!managerId) return NextResponse.json({ success: false, data: null, error: "managerId required" }, { status: 400 });

    const existing = await prisma.corporateManager.findFirst({
      where: { id: managerId, organizationId: id, role: { not: "employee" } },
    });
    if (!existing) return NextResponse.json({ success: false, data: null, error: "Manager not found" }, { status: 404 });

    const body = await req.json();
    const result = editManagerSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ success: false, data: null, error: result.error.issues[0]?.message ?? "Invalid input" }, { status: 422 });

    if (result.data.email && result.data.email !== existing.email) {
      const emailExists = await prisma.corporateManager.findUnique({
        where: { organizationId_email: { organizationId: id, email: result.data.email.toLowerCase() } },
      });
      if (emailExists) return NextResponse.json({ success: false, data: null, error: "Email already in use" }, { status: 422 });
    }

    const updated = await prisma.corporateManager.update({
      where: { id: managerId },
      data: {
        ...(result.data.name !== undefined ? { name: result.data.name } : {}),
        ...(result.data.email !== undefined ? { email: result.data.email.toLowerCase() } : {}),
        ...(result.data.role !== undefined ? { role: result.data.role } : {}),
        ...(result.data.isActive !== undefined ? { isActive: result.data.isActive } : {}),
      },
    });

    await prisma.auditLog.create({
      data: {
        tenantId: id,
        actorId: token!.id as string,
        actorRole: "ADMIN",
        action: "MANAGER_UPDATE",
        entity: "CorporateManager",
        entityId: managerId,
        meta: { before: existing, after: updated },
      },
    });

    return NextResponse.json({ success: true, data: updated, error: null });
  } catch (err) {
    console.error("[PUT /api/admin/corporate/:id/managers]", err);
    return NextResponse.json({ success: false, data: null, error: "Failed to update manager" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE — Soft delete a manager (deactivate, not remove)           */
/* ------------------------------------------------------------------ */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const guard = requireAdmin(token);
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const managerId = searchParams.get("managerId");
    if (!managerId) return NextResponse.json({ success: false, data: null, error: "managerId required" }, { status: 400 });

    const existing = await prisma.corporateManager.findFirst({
      where: { id: managerId, organizationId: id, role: { not: "employee" } },
    });
    if (!existing) return NextResponse.json({ success: false, data: null, error: "Manager not found" }, { status: 404 });

    // Prevent deactivating the last tenant admin
    if (existing.isTenantAdmin) {
      const otherAdmins = await prisma.corporateManager.count({
        where: { organizationId: id, isTenantAdmin: true, isActive: true, id: { not: managerId } },
      });
      if (otherAdmins === 0) {
        return NextResponse.json({ success: false, data: null, error: "Cannot deactivate the last tenant admin" }, { status: 422 });
      }
    }

    await prisma.corporateManager.update({
      where: { id: managerId },
      data: { isActive: false },
    });

    await prisma.auditLog.create({
      data: {
        tenantId: id,
        actorId: token!.id as string,
        actorRole: "ADMIN",
        action: "MANAGER_DEACTIVATE",
        entity: "CorporateManager",
        entityId: managerId,
        meta: { name: existing.name, email: existing.email },
      },
    });

    return NextResponse.json({ success: true, data: { deactivated: true }, error: null });
  } catch (err) {
    console.error("[DELETE /api/admin/corporate/:id/managers]", err);
    return NextResponse.json({ success: false, data: null, error: "Failed to deactivate manager" }, { status: 500 });
  }
}
