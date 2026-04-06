import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth-guards";
import {
  getTenantById,
  updateTenant,
} from "@/lib/repositories/superadmin.repository";
import { prisma } from "@/lib/prisma";

const updateTenantSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  subdomain: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/).optional(),
  customDomain: z.string().nullable().optional(),
  email: z.string().email().optional(),
  isActive: z.boolean().optional(),
  plan: z.enum(["TRIAL", "STARTER", "PROFESSIONAL", "ENTERPRISE"]).optional(),
  planExpiresAt: z.string().datetime().nullable().optional(),
  billingEmail: z.string().email().nullable().optional(),
  maxSeats: z.number().int().min(1).optional(),
  siteName: z.string().nullable().optional(),
  tagline: z.string().nullable().optional(),
  primaryColor: z.string().nullable().optional(),
  secondaryColor: z.string().nullable().optional(),
  logoUrl: z.string().url().nullable().optional(),
  faviconUrl: z.string().url().nullable().optional(),
  bannerImageUrl: z.string().url().nullable().optional(),
  mission: z.string().max(1000).nullable().optional(),
  vision: z.string().max(1000).nullable().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireSuperAdmin(token);
    if (!guard.ok) return guard.response;

    const { id } = await params;
    const tenant = await getTenantById(id);
    if (!tenant) {
      return NextResponse.json({ success: false, data: null, error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: tenant, error: null });
  } catch (err) {
    console.error("[GET /api/superadmin/tenants/[id]]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireSuperAdmin(token);
    if (!guard.ok) return guard.response;

    const { id } = await params;
    const body = await request.json();
    const result = updateTenantSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, data: null, error: result.error.issues[0].message },
        { status: 422 },
      );
    }

    const { planExpiresAt, ...rest } = result.data;
    const updated = await updateTenant(id, {
      ...rest,
      ...(planExpiresAt !== undefined && {
        planExpiresAt: planExpiresAt ? new Date(planExpiresAt) : null,
      }),
    });
    return NextResponse.json({ success: true, data: updated, error: null });
  } catch (err) {
    console.error("[PATCH /api/superadmin/tenants/[id]]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireSuperAdmin(token);
    if (!guard.ok) return guard.response;

    const { id } = await params;

    const tenant = await prisma.organization.findUnique({ where: { id } });
    if (!tenant) {
      return NextResponse.json({ success: false, data: null, error: "Tenant not found" }, { status: 404 });
    }

    // Prevent deleting the default/platform tenant
    if (tenant.isDefault) {
      return NextResponse.json(
        { success: false, data: null, error: "Cannot delete the default platform tenant." },
        { status: 403 },
      );
    }

    // Step 1: Null-out all optional FKs pointing to this org
    // Course uses `tenantId`, all others use `organizationId`
    await prisma.course.updateMany({ where: { tenantId: id }, data: { tenantId: null } });
    await prisma.student.updateMany({ where: { organizationId: id }, data: { organizationId: null } });
    await prisma.enrollment.updateMany({ where: { organizationId: id }, data: { organizationId: null } });
    await prisma.conversation.updateMany({ where: { tenantId: id }, data: { tenantId: null } });
    await prisma.notification.updateMany({ where: { tenantId: id }, data: { tenantId: null } });

    // Step 2: Delete required relations with NO onDelete: Cascade
    await prisma.tenantTrainer.deleteMany({ where: { tenantId: id } });
    await prisma.tenantSubscription.deleteMany({ where: { tenantId: id } });
    await prisma.corporateManager.deleteMany({ where: { organizationId: id } });

    // Step 3: Delete the organization.
    // Acc*, OrganizationTask, OrganizationFile, TenantPage, TenantTheme,
    // TenantInvite, TenantFeatureFlag all have onDelete: Cascade — auto-removed.
    await prisma.organization.delete({ where: { id } });

    return NextResponse.json({ success: true, data: { id }, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[DELETE /api/superadmin/tenants/[id]]", message);
    return NextResponse.json(
      { success: false, data: null, error: message },
      { status: 500 },
    );
  }
}
