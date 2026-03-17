import { prisma } from "@/lib/prisma";
import type { AnalyticsStats } from "@/types";

export async function getAnalyticsStats(tenantId: string): Promise<AnalyticsStats> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const courseWhere = { tenantId };
  const enrollmentWhere = { course: { tenantId } };

  const [total, pending, approved, rejected, recent, courseBreakdown] = await Promise.all([
    prisma.enrollment.count({ where: enrollmentWhere }),
    prisma.enrollment.count({ where: { ...enrollmentWhere, status: "PENDING" } }),
    prisma.enrollment.count({ where: { ...enrollmentWhere, status: "APPROVED" } }),
    prisma.enrollment.count({ where: { ...enrollmentWhere, status: "REJECTED" } }),
    prisma.enrollment.count({ where: { ...enrollmentWhere, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.course.findMany({
      where: { ...courseWhere, isActive: true },
      select: {
        slug: true,
        title: true,
        _count: { select: { enrollments: true } },
      },
    }),
  ]);

  return {
    totalEnrollments: total,
    pendingCount: pending,
    approvedCount: approved,
    rejectedCount: rejected,
    recentEnrollments: recent,
    enrollmentsByCourse: courseBreakdown.map((c) => ({
      slug: c.slug,
      title: c.title,
      count: c._count.enrollments,
    })),
  };
}
