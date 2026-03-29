import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  GET /api/admin/revenue/dashboard                                   */
/*  Returns KPI stats + 6-month chart data scoped to the tenant       */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const tenantId = guard.tenantId;

    // ── KPI totals ──────────────────────────────────────────────────
    const [totalPaid, totalPending, enrollmentCount, courseBreakdown] =
      await Promise.all([
        // Total paid
        prisma.payment.aggregate({
          where: {
            status: "PAID",
            enrollment: { organizationId: tenantId },
          },
          _sum: { amount: true },
        }),

        // Total pending
        prisma.payment.aggregate({
          where: {
            status: "PENDING_PAYMENT",
            enrollment: { organizationId: tenantId },
          },
          _sum: { amount: true },
        }),

        // Paid enrollment count
        prisma.payment.count({
          where: {
            status: "PAID",
            enrollment: { organizationId: tenantId },
          },
        }),

        // Revenue by course (top 5)
        prisma.payment.groupBy({
          by: ["enrollmentId"],
          where: {
            status: "PAID",
            enrollment: { organizationId: tenantId },
          },
          _sum: { amount: true },
        }),
      ]);

    // ── Monthly chart — last 6 months ───────────────────────────────
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyPayments = await prisma.payment.findMany({
      where: {
        status: "PAID",
        paidAt: { gte: sixMonthsAgo },
        enrollment: { organizationId: tenantId },
      },
      select: { amount: true, paidAt: true },
      orderBy: { paidAt: "asc" },
    });

    // Aggregate by month
    const monthMap: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthMap[key] = 0;
    }
    for (const p of monthlyPayments) {
      if (!p.paidAt) continue;
      const key = `${p.paidAt.getFullYear()}-${String(p.paidAt.getMonth() + 1).padStart(2, "0")}`;
      if (key in monthMap) {
        monthMap[key] += Number(p.amount);
      }
    }

    const chartData = Object.entries(monthMap).map(([month, revenue]) => ({
      month,
      revenue,
    }));

    // ── This month total ────────────────────────────────────────────
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthTotal = await prisma.payment.aggregate({
      where: {
        status: "PAID",
        paidAt: { gte: monthStart },
        enrollment: { organizationId: tenantId },
      },
      _sum: { amount: true },
    });

    // ── Top courses by revenue ──────────────────────────────────────
    const enrollmentIds = courseBreakdown.map((r) => r.enrollmentId);
    const enrollments = enrollmentIds.length > 0
      ? await prisma.enrollment.findMany({
          where: { id: { in: enrollmentIds } },
          select: {
            id: true,
            courseId: true,
            course: { select: { title: true } },
          },
        })
      : [];

    const courseRevMap: Record<string, { title: string; total: number }> = {};
    for (const row of courseBreakdown) {
      const enroll = enrollments.find((e) => e.id === row.enrollmentId);
      if (!enroll) continue;
      const key = enroll.courseId;
      if (!courseRevMap[key]) {
        courseRevMap[key] = { title: enroll.course.title, total: 0 };
      }
      courseRevMap[key].total += Number(row._sum.amount ?? 0);
    }
    const topCourses = Object.values(courseRevMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue:    Number(totalPaid._sum.amount ?? 0),
        thisMonth:       Number(thisMonthTotal._sum.amount ?? 0),
        pendingAmount:   Number(totalPending._sum.amount ?? 0),
        paidEnrollments: enrollmentCount,
        chartData,
        topCourses,
      },
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/admin/revenue/dashboard]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
