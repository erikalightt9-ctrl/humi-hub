import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import {
  getRecentActivity,
  getEnrollmentPipeline,
  getRevenueSnapshot,
} from "@/lib/repositories/dashboard.repository";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/dashboard
 * Returns unified dashboard stats:
 *   totalUsers, totalCourses, messagesToday, recentActivity[]
 *   + enrollmentPipeline, revenueSnapshot
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalStudents,
      totalTrainers,
      totalCourses,
      messagesToday,
      recentActivity,
      enrollmentPipeline,
      revenueSnapshot,
    ] = await Promise.all([
      prisma.student.count({ where: { accessGranted: true } }),
      prisma.trainer.count({ where: { isActive: true } }),
      prisma.course.count({ where: { isActive: true } }),
      prisma.directMessage.count({ where: { createdAt: { gte: todayStart } } }),
      getRecentActivity(10),
      getEnrollmentPipeline(),
      getRevenueSnapshot(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalUsers: totalStudents + totalTrainers,
        totalStudents,
        totalTrainers,
        totalCourses,
        messagesToday,
        recentActivity,
        enrollmentPipeline,
        revenueSnapshot,
      },
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/admin/dashboard]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
