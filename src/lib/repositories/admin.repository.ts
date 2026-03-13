import { prisma } from "@/lib/prisma";
import type { AnalyticsStats } from "@/types";

export async function getAnalyticsStats(): Promise<AnalyticsStats> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [total, pending, approved, rejected, recent, courseBreakdown] = await Promise.all([
    prisma.enrollment.count(),
    prisma.enrollment.count({ where: { status: "PENDING" } }),
    prisma.enrollment.count({ where: { status: "APPROVED" } }),
    prisma.enrollment.count({ where: { status: "REJECTED" } }),
    prisma.enrollment.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.course.findMany({
      where: { isActive: true },
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
