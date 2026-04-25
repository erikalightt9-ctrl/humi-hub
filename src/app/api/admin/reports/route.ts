import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const tenantId = guard.tenantId;

    const yearStart = new Date(new Date().getFullYear(), 0, 1);
    const yearEnd   = new Date(new Date().getFullYear() + 1, 0, 1);

    const [
      // Leave breakdown by type (approved, this year)
      leaveByType,
      // Leave breakdown by status (all time)
      leaveByStatus,
      // Payroll runs summary (last 6)
      payrollRuns,
      // Headcount by status
      headcount,
      // Attendance summary this month
      attendanceThisMonth,
    ] = await Promise.all([
      prisma.hrLeaveRequest.groupBy({
        by: ["leaveType"],
        where: {
          employee: { organizationId: tenantId },
          status:   "APPROVED",
          startDate: { gte: yearStart, lt: yearEnd },
        },
        _sum:   { totalDays: true },
        _count: { _all: true },
      }),

      prisma.hrLeaveRequest.groupBy({
        by: ["status"],
        where: {
          employee: { organizationId: tenantId },
          startDate: { gte: yearStart, lt: yearEnd },
        },
        _count: { _all: true },
      }),

      prisma.hrPayrollRun.findMany({
        where:   { organizationId: tenantId },
        orderBy: { periodStart: "desc" },
        take:    6,
        select: {
          id:          true,
          runNumber:   true,
          periodStart: true,
          periodEnd:   true,
          status:      true,
          totalGross:  true,
          totalNet:    true,
          _count:      { select: { lines: true } },
        },
      }),

      prisma.hrEmployee.groupBy({
        by:    ["status"],
        where: { organizationId: tenantId },
        _count: { _all: true },
      }),

      (async () => {
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const monthEnd   = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
        return prisma.hrAttendanceLog.groupBy({
          by:    ["status"],
          where: {
            employee: { organizationId: tenantId },
            date:     { gte: monthStart, lt: monthEnd },
          },
          _count: { _all: true },
        });
      })(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        year: new Date().getFullYear(),
        leaveByType:   leaveByType.map((r) => ({
          leaveType: r.leaveType,
          days:      Number(r._sum.totalDays ?? 0),
          requests:  r._count._all,
        })),
        leaveByStatus: leaveByStatus.map((r) => ({
          status:   r.status,
          requests: r._count._all,
        })),
        payrollRuns: payrollRuns.map((r) => ({
          id:          r.id,
          runNumber:   r.runNumber,
          periodStart: r.periodStart,
          periodEnd:   r.periodEnd,
          status:      r.status,
          totalGross:  Number(r.totalGross),
          totalNet:    Number(r.totalNet),
          lineCount:   r._count.lines,
        })),
        headcount: headcount.map((r) => ({
          status: r.status,
          count:  r._count._all,
        })),
        attendanceThisMonth: attendanceThisMonth.map((r) => ({
          status: r.status,
          count:  r._count._all,
        })),
      },
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/admin/reports]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
