import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin, isAdminRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { tenantId } = guard;
    const url    = new URL(req.url);
    const search = url.searchParams.get("search") ?? "";
    const page   = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
    const limit  = 20;

    const where = {
      organizationId: tenantId,
      ...(search
        ? {
            OR: [
              { name:  { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [members, total] = await Promise.all([
      prisma.corporateManager.findMany({
        where,
        select: {
          id:                 true,
          name:               true,
          email:              true,
          userRole:           true,
          department:         true,
          phone:              true,
          isActive:           true,
          isTenantAdmin:      true,
          mustChangePassword: true,
          createdAt:          true,
        },
        orderBy: [{ isTenantAdmin: "desc" }, { name: "asc" }],
        skip:  (page - 1) * limit,
        take:  limit,
      }),
      prisma.corporateManager.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: { members, total }, error: null });
  } catch (err) {
    console.error("[GET /api/admin/team]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;
    if (!isAdminRole(token)) {
      return NextResponse.json({ success: false, data: null, error: "Only Admins can add team members" }, { status: 403 });
    }

    const { tenantId } = guard;
    const body = await req.json() as {
      name: string;
      email: string;
      password: string;
      userRole?: string;
      department?: string;
      phone?: string;
    };

    if (!body.name?.trim() || !body.email?.trim() || !body.password?.trim()) {
      return NextResponse.json({ success: false, data: null, error: "Name, email, and password are required" }, { status: 400 });
    }

    const emailLower = body.email.trim().toLowerCase();
    const existing = await prisma.corporateManager.findFirst({
      where: { organizationId: tenantId, email: emailLower },
    });
    if (existing) {
      return NextResponse.json({ success: false, data: null, error: "A team member with this email already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(body.password.trim(), 12);
    const validRoles   = ["ADMIN", "EXECUTIVE", "MANAGER"];
    const userRole     = validRoles.includes(body.userRole ?? "") ? body.userRole as "ADMIN" | "EXECUTIVE" | "MANAGER" : "MANAGER";

    const member = await prisma.corporateManager.create({
      data: {
        organizationId:     tenantId,
        name:               body.name.trim(),
        email:              emailLower,
        passwordHash,
        userRole,
        department:         body.department?.trim() || null,
        phone:              body.phone?.trim() || null,
        isTenantAdmin:      false,
        mustChangePassword: true,
      },
      select: {
        id: true, name: true, email: true, userRole: true,
        department: true, isActive: true, isTenantAdmin: true,
        mustChangePassword: true, createdAt: true,
      },
    });

    return NextResponse.json({ success: true, data: { member }, error: null }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/team]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
