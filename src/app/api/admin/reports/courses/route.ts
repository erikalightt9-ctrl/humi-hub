import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/reports/courses
 * Course breakdown: enrollment counts, completion rates per course.
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const courses = await prisma.course.findMany({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        slug: true,
        _count: {
          select: {
            enrollments: true,
            certificates: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: courses.map((c) => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        totalEnrollments: c._count.enrollments,
        certificatesIssued: c._count.certificates,
        completionRate:
          c._count.enrollments > 0
            ? Math.round((c._count.certificates / c._count.enrollments) * 100)
            : 0,
      })),
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/admin/reports/courses]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
