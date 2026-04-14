import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { createId } from "@paralleldrive/cuid2";
import { sendTenantUserCredentialsEmail } from "@/lib/email/send-user-credentials";
import type { ModuleKey } from "@/lib/modules";

export const dynamic = "force-dynamic";

const BCRYPT_ROUNDS = 12;

function generateTempPassword(): string {
  return crypto.randomBytes(8).toString("hex"); // 16-char hex
}

/* ------------------------------------------------------------------ */
/*  GET /api/admin/portal-users                                         */
/*  List all portal users for the current tenant's organization         */
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

    // Resolve organizationId for this tenant
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";
    const page   = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const limit  = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "20")));
    const skip   = (page - 1) * limit;

    const where = {
      organizationId: org.id,
      ...(search
        ? {
            OR: [
              { name:  { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      prisma.tenantUser.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id:                 true,
          name:               true,
          email:              true,
          roleLabel:          true,
          roleId:             true,
          permissions:        true,
          isActive:           true,
          mustChangePassword: true,
          createdAt:          true,
        },
      }),
      prisma.tenantUser.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: { users, total, page, limit },
      error: null,
    });
  } catch (err) {
    console.error("[portal-users GET]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Failed to fetch portal users" },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/admin/portal-users                                        */
/*  Create a new portal user, generate temp password, send email        */
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
      select: { id: true, name: true },
    });

    if (!org) {
      return NextResponse.json(
        { success: false, data: null, error: "Organization not found" },
        { status: 404 },
      );
    }

    const body = await request.json() as {
      name?:        string;
      email?:       string;
      roleLabel?:   string;
      roleId?:      string | null;
      permissions?: ModuleKey[];
    };

    const { name, email, roleLabel = "User", roleId = null, permissions = [] } = body;

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json(
        { success: false, data: null, error: "Name and email are required" },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check for duplicate email within the same organization
    const existing = await prisma.tenantUser.findUnique({
      where: { organizationId_email: { organizationId: org.id, email: normalizedEmail } },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, data: null, error: "A user with this email already exists in your organization" },
        { status: 409 },
      );
    }

    const tempPassword   = generateTempPassword();
    const passwordHash   = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS);

    const newUser = await prisma.tenantUser.create({
      data: {
        id:                 createId(),
        organizationId:     org.id,
        roleId:             roleId ?? null,
        name:               name.trim(),
        email:              normalizedEmail,
        passwordHash,
        mustChangePassword: true,
        roleLabel:          roleLabel.trim() || "User",
        permissions,
        isActive:           true,
      },
      select: {
        id:          true,
        name:        true,
        email:       true,
        roleLabel:   true,
        roleId:      true,
        permissions: true,
        isActive:    true,
        createdAt:   true,
      },
    });

    // Send credentials email — fire and forget (don't fail the request on email error)
    sendTenantUserCredentialsEmail({
      name:              newUser.name,
      email:             newUser.email,
      organizationName:  org.name,
      roleLabel:         newUser.roleLabel,
      temporaryPassword: tempPassword,
      permissions:       newUser.permissions,
    }).catch((err: unknown) => {
      console.error("[portal-users] Failed to send credentials email:", err);
    });

    return NextResponse.json(
      { success: true, data: { user: newUser }, error: null },
      { status: 201 },
    );
  } catch (err) {
    console.error("[portal-users POST]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Failed to create portal user" },
      { status: 500 },
    );
  }
}
