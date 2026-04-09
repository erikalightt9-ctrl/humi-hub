import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireSuperAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const MAX_ADMINS_PER_TENANT = 5;

/** GET /api/superadmin/tenants/[id]/admins — list tenant admins */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getToken({ req: request });
  const guard = requireSuperAdmin(token);
  if (!guard.ok) return guard.response;

  const { id: tenantId } = await params;

  const admins = await prisma.corporateManager.findMany({
    where: { organizationId: tenantId },
    select: {
      id: true,
      email: true,
      name: true,
      isTenantAdmin: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    success: true,
    data: admins,
    meta: {
      count: admins.length,
      limit: MAX_ADMINS_PER_TENANT,
      canAddMore: admins.length < MAX_ADMINS_PER_TENANT,
    },
    error: null,
  });
}

/** POST /api/superadmin/tenants/[id]/admins — create a tenant admin (max 5) */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getToken({ req: request });
  const guard = requireSuperAdmin(token);
  if (!guard.ok) return guard.response;

  const { id: tenantId } = await params;

  // Verify tenant exists and is active
  const tenant = await prisma.organization.findUnique({
    where: { id: tenantId },
    select: { id: true, isActive: true, name: true },
  });
  if (!tenant) {
    return NextResponse.json(
      { success: false, data: null, error: "Tenant not found." },
      { status: 404 },
    );
  }
  if (!tenant.isActive) {
    return NextResponse.json(
      { success: false, data: null, error: "Tenant account is inactive." },
      { status: 403 },
    );
  }

  // Enforce max 5 admins per tenant
  const currentCount = await prisma.corporateManager.count({
    where: { organizationId: tenantId },
  });
  if (currentCount >= MAX_ADMINS_PER_TENANT) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: `This tenant has reached the maximum of ${MAX_ADMINS_PER_TENANT} admin accounts. Remove an existing admin before adding a new one.`,
      },
      { status: 422 },
    );
  }

  const body = await request.json();
  const { name, email, password, isTenantAdmin = false } = body ?? {};

  if (!name || !email || !password) {
    return NextResponse.json(
      { success: false, data: null, error: "name, email, and password are required." },
      { status: 400 },
    );
  }

  // Check email uniqueness within tenant
  const existing = await prisma.corporateManager.findFirst({
    where: { email: email.trim().toLowerCase(), organizationId: tenantId },
  });
  if (existing) {
    return NextResponse.json(
      { success: false, data: null, error: "An admin with this email already exists for this tenant." },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.corporateManager.create({
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      organizationId: tenantId,
      isTenantAdmin: Boolean(isTenantAdmin),
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      name: true,
      isTenantAdmin: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json(
    {
      success: true,
      data: admin,
      meta: {
        count: currentCount + 1,
        limit: MAX_ADMINS_PER_TENANT,
        canAddMore: currentCount + 1 < MAX_ADMINS_PER_TENANT,
      },
      error: null,
    },
    { status: 201 },
  );
}

/** PATCH /api/superadmin/tenants/[id]/admins — reset a tenant admin's password */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getToken({ req: request });
  const guard = requireSuperAdmin(token);
  if (!guard.ok) return guard.response;

  const { id: tenantId } = await params;
  const body = await request.json();
  const { adminId, newPassword } = body ?? {};

  if (!adminId || !newPassword || newPassword.length < 8) {
    return NextResponse.json(
      { success: false, data: null, error: "adminId and newPassword (min 8 chars) are required." },
      { status: 400 },
    );
  }

  const admin = await prisma.corporateManager.findFirst({
    where: { id: adminId, organizationId: tenantId },
  });
  if (!admin) {
    return NextResponse.json(
      { success: false, data: null, error: "Admin not found for this tenant." },
      { status: 404 },
    );
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.corporateManager.update({
    where: { id: adminId },
    data:  { passwordHash, mustChangePassword: true },
  });

  return NextResponse.json({ success: true, data: null, error: null });
}

/** DELETE /api/superadmin/tenants/[id]/admins?adminId=xxx — remove a tenant admin */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getToken({ req: request });
  const guard = requireSuperAdmin(token);
  if (!guard.ok) return guard.response;

  const { id: tenantId } = await params;
  const { searchParams } = new URL(request.url);
  const adminId = searchParams.get("adminId");

  if (!adminId) {
    return NextResponse.json(
      { success: false, data: null, error: "adminId query param is required." },
      { status: 400 },
    );
  }

  const admin = await prisma.corporateManager.findFirst({
    where: { id: adminId, organizationId: tenantId },
  });
  if (!admin) {
    return NextResponse.json(
      { success: false, data: null, error: "Admin not found for this tenant." },
      { status: 404 },
    );
  }

  await prisma.corporateManager.delete({ where: { id: adminId } });

  const remaining = await prisma.corporateManager.count({
    where: { organizationId: tenantId },
  });

  return NextResponse.json({
    success: true,
    data: null,
    meta: {
      count: remaining,
      limit: MAX_ADMINS_PER_TENANT,
      canAddMore: remaining < MAX_ADMINS_PER_TENANT,
    },
    error: null,
  });
}
