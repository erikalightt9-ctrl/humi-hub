import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { searchParams } = req.nextUrl;
    const search = searchParams.get("search") ?? "";
    const courseId = searchParams.get("courseId") ?? undefined;
    const scheduleId = searchParams.get("scheduleId") ?? undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "50", 10));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (scheduleId) where.scheduleId = scheduleId;
    if (courseId) where.enrollment = { courseId };
    if (search) where.name = { contains: search, mode: "insensitive" };

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: {
          enrollment: { select: { courseId: true, course: { select: { id: true, title: true } } } },
          schedule: { select: { id: true, name: true } },
          certificates: { select: { id: true, courseId: true, issuedAt: true } },
          sessionAttendances: { select: { present: true } },
        },
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      prisma.student.count({ where }),
    ]);

    const data = students.map((s) => {
      const presentCount = s.sessionAttendances.filter((a) => a.present).length;
      const totalSessions = s.sessionAttendances.length;
      const attendancePct = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : null;
      const courseCert = s.certificates.find((c) => c.courseId === s.enrollment?.courseId);
      return {
        id: s.id,
        name: s.name,
        email: s.email,
        course: s.enrollment?.course ?? null,
        schedule: s.schedule ?? null,
        accessGranted: s.accessGranted,
        presentCount,
        totalSessions,
        attendancePct,
        certificate: courseCert ? { id: courseCert.id, issuedAt: courseCert.issuedAt } : null,
      };
    });

    return NextResponse.json({
      success: true,
      data: { participants: data, total, page, totalPages: Math.ceil(total / limit) },
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/admin/training-center/participants]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
