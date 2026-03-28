import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/reports/overview
 * High-level platform summary for the reports section.
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalStudents,
      newStudents,
      totalTrainers,
      totalCourses,
      activeCourses,
      totalEnrollments,
      recentEnrollments,
      totalCertificates,
      recentCertificates,
      revenueTotal,
      revenueRecent,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.student.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.trainer.count({ where: { isActive: true } }),
      prisma.course.count(),
      prisma.course.count({ where: { isActive: true } }),
      prisma.enrollment.count(),
      prisma.enrollment.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.certificate.count(),
      prisma.certificate.count({ where: { issuedAt: { gte: thirtyDaysAgo } } }),
      prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
      prisma.payment.aggregate({ where: { status: "PAID", paidAt: { gte: thirtyDaysAgo } }, _sum: { amount: true } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        users: { total: totalStudents + totalTrainers, students: totalStudents, trainers: totalTrainers, newLast30Days: newStudents },
        courses: { total: totalCourses, active: activeCourses },
        enrollments: { total: totalEnrollments, last30Days: recentEnrollments },
        certificates: { total: totalCertificates, last30Days: recentCertificates },
        revenue: {
          total: Number(revenueTotal._sum.amount ?? 0),
          last30Days: Number(revenueRecent._sum.amount ?? 0),
        },
      },
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/admin/reports/overview]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
