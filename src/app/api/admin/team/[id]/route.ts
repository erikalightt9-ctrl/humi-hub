import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin, isAdminRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;
    if (!isAdminRole(token)) {
      return NextResponse.json({ success: false, data: null, error: "Only Admins can modify team members" }, { status: 403 });
    }

    const { tenantId } = guard;
    const { id } = await params;
    const body = await req.json() as {
      userRole?: string;
      isActive?: boolean;
      department?: string;
      phone?: string;
      name?: string;
    };

    const member = await prisma.corporateManager.findFirst({
      where: { id, organizationId: tenantId },
    });
    if (!member) {
      return NextResponse.json({ success: false, data: null, error: "Team member not found" }, { status: 404 });
    }

    // Prevent demoting the last tenant admin
    if (member.isTenantAdmin && body.userRole && body.userRole !== "ADMIN") {
      const adminCount = await prisma.corporateManager.count({
        where: { organizationId: tenantId, isTenantAdmin: true },
      });
      if (adminCount <= 1) {
        return NextResponse.json(
          { success: false, data: null, error: "Cannot change the role of the last Admin" },
          { status: 400 },
        );
      }
    }

    const validRoles = ["ADMIN", "EXECUTIVE", "MANAGER"];
    const updated = await prisma.corporateManager.update({
      where: { id },
      data: {
        ...(body.userRole && validRoles.includes(body.userRole)
          ? { userRole: body.userRole as "ADMIN" | "EXECUTIVE" | "MANAGER" }
          : {}),
        ...(typeof body.isActive === "boolean" ? { isActive: body.isActive } : {}),
        ...(body.department !== undefined ? { department: body.department || null } : {}),
        ...(body.phone !== undefined ? { phone: body.phone || null } : {}),
        ...(body.name?.trim() ? { name: body.name.trim() } : {}),
      },
      select: {
        id: true, name: true, email: true, userRole: true,
        department: true, isActive: true, isTenantAdmin: true,
        mustChangePassword: true, createdAt: true,
      },
    });

    return NextResponse.json({ success: true, data: { member: updated }, error: null });
  } catch (err) {
    console.error("[PATCH /api/admin/team/:id]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;
    if (!isAdminRole(token)) {
      return NextResponse.json({ success: false, data: null, error: "Only Admins can remove team members" }, { status: 403 });
    }

    const { tenantId } = guard;
    const { id } = await params;

    const member = await prisma.corporateManager.findFirst({
      where: { id, organizationId: tenantId },
    });
    if (!member) {
      return NextResponse.json({ success: false, data: null, error: "Team member not found" }, { status: 404 });
    }
    if (member.isTenantAdmin) {
      const adminCount = await prisma.corporateManager.count({
        where: { organizationId: tenantId, isTenantAdmin: true },
      });
      if (adminCount <= 1) {
        return NextResponse.json(
          { success: false, data: null, error: "Cannot remove the last Admin" },
          { status: 400 },
        );
      }
    }

    await prisma.corporateManager.delete({ where: { id } });
    return NextResponse.json({ success: true, data: null, error: null });
  } catch (err) {
    console.error("[DELETE /api/admin/team/:id]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
