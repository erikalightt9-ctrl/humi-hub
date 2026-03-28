import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

// GET /api/admin/corporate/:id/dashboard
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const guard = requireAdmin(token);
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;

    const org = await prisma.organization.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            students: true,
            managers: true,
          },
        },
        courses: {
          where: { isActive: true },
          select: {
            id: true,
            title: true,
            _count: { select: { enrollments: true } },
          },
        },
        students: {
          select: { id: true },
        },
      },
    });

    if (!org) {
      return NextResponse.json({ success: false, data: null, error: "Organization not found" }, { status: 404 });
    }

    const studentIds = org.students.map((s) => s.id);

    // Average progress across all students in this org
    const progressAgg = studentIds.length > 0
      ? await prisma.courseProgress.aggregate({
          where: { studentId: { in: studentIds } },
          _avg: { percentComplete: true },
        })
      : { _avg: { percentComplete: 0 } };

    // Per-course stats for this org
    const courseStats = await Promise.all(
      org.courses.map(async (course) => {
        const progAgg = studentIds.length > 0
          ? await prisma.courseProgress.aggregate({
              where: { courseId: course.id, studentId: { in: studentIds } },
              _avg: { percentComplete: true },
              _count: { studentId: true },
            })
          : { _avg: { percentComplete: 0 }, _count: { studentId: 0 } };

        return {
          courseId: course.id,
          title: course.title,
          enrolledCount: progAgg._count.studentId,
          avgProgress: Math.round(progAgg._avg.percentComplete ?? 0),
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        totalEmployees: org._count.students,
        totalManagers: org._count.managers,
        activeCourses: org.courses.length,
        avgProgress: Math.round(progressAgg._avg.percentComplete ?? 0),
        courseStats,
      },
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/admin/corporate/:id/dashboard]", err);
    return NextResponse.json({ success: false, data: null, error: "Failed to fetch dashboard" }, { status: 500 });
  }
}
