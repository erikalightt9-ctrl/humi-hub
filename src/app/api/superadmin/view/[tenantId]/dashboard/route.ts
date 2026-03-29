import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireSuperAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ tenantId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireSuperAdmin(token);
    if (!guard.ok) return guard.response;

    const { tenantId } = await params;

    const [org, studentCount, courseCount, enrollmentCount, recentEnrollments] =
      await Promise.all([
        prisma.organization.findUnique({
          where: { id: tenantId },
          select: {
            id: true,
            name: true,
            slug: true,
            plan: true,
            isActive: true,
            email: true,
            subdomain: true,
            createdAt: true,
          },
        }),
        prisma.student.count({ where: { organizationId: tenantId } }),
        prisma.course.count({ where: { tenantId, isActive: true } }),
        prisma.enrollment.count({ where: { organizationId: tenantId } }),
        prisma.enrollment.findMany({
          where: { organizationId: tenantId },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            fullName: true,
            email: true,
            createdAt: true,
            course: { select: { title: true } },
          },
        }),
      ]);

    if (!org) {
      return NextResponse.json(
        { success: false, data: null, error: "Tenant not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: { org, studentCount, courseCount, enrollmentCount, recentEnrollments },
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/superadmin/view/[tenantId]/dashboard]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
