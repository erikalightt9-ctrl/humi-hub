import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

const cache = new Map<string, { data: unknown; expiresAt: number }>();
const TTL = 2 * 60 * 1000;

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;
    const tenantId = guard.tenantId;

    const hit = cache.get(tenantId);
    if (hit && hit.expiresAt > Date.now()) {
      return NextResponse.json({ success: true, data: hit.data, error: null });
    }

    const now       = new Date();
    const today     = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow  = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [
      activeEmployees,
      pendingLeaves,
      attendanceToday,
      lastPayrollRun,
      bankAgg,
      openInvoiceAgg,
      expenseAgg,
      pendingRepairs,
      activeCourses,
      activeEnrollments,
      recentLeaves,
      recentPayroll,
      recentInvoices,
      recentRepairs,
      salesPipelineAgg,
      salesWonThisMonth,
      openItRequests,
      recentDeals,
    ] = await Promise.all([
      prisma.hrEmployee.count({
        where: { organizationId: tenantId, status: "ACTIVE" },
      }),
      prisma.hrLeaveRequest.count({
        where: { employee: { organizationId: tenantId }, status: "PENDING" },
      }),
      prisma.hrAttendanceLog.groupBy({
        by: ["status"],
        where: { employee: { organizationId: tenantId }, date: { gte: today, lt: tomorrow } },
        _count: { _all: true },
      }),
      prisma.hrPayrollRun.findFirst({
        where: { organizationId: tenantId },
        orderBy: { periodStart: "desc" },
        select: {
          status: true, periodStart: true, periodEnd: true, totalNet: true,
          _count: { select: { lines: true } },
        },
      }),
      prisma.accBankAccount.aggregate({
        where: { organizationId: tenantId },
        _sum: { currentBalance: true },
        _count: { _all: true },
      }),
      prisma.accInvoice.aggregate({
        where: {
          organizationId: tenantId,
          status: { notIn: ["PAID", "CANCELLED", "VOIDED"] },
        },
        _sum: { totalAmount: true, paidAmount: true },
        _count: { _all: true },
      }),
      prisma.accExpense.aggregate({
        where: {
          organizationId: tenantId,
          status: { in: ["APPROVED", "PAID"] },
          expenseDate: { gte: monthStart, lt: monthEnd },
        },
        _sum: { totalAmount: true },
      }),
      prisma.adminRepairLog.count({
        where: { organizationId: tenantId, status: { in: ["PENDING", "IN_PROGRESS"] } },
      }),
      prisma.course.count({
        where: { tenantId, isActive: true, deletedAt: null },
      }),
      prisma.enrollment.count({
        where: {
          course: { tenantId },
          status: { in: ["ENROLLED", "APPROVED", "PAYMENT_VERIFIED"] },
        },
      }),
      // Activity feed sources
      prisma.hrLeaveRequest.findMany({
        where: { employee: { organizationId: tenantId } },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          leaveType: true, status: true, createdAt: true,
          employee: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.hrPayrollRun.findMany({
        where: { organizationId: tenantId },
        orderBy: { createdAt: "desc" },
        take: 2,
        select: { runNumber: true, status: true, totalNet: true, createdAt: true },
      }),
      prisma.accInvoice.findMany({
        where: { organizationId: tenantId },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { invoiceNumber: true, customerName: true, totalAmount: true, status: true, createdAt: true },
      }),
      prisma.adminRepairLog.findMany({
        where: { organizationId: tenantId },
        orderBy: { createdAt: "desc" },
        take: 2,
        select: { itemName: true, status: true, createdAt: true },
      }),
      prisma.crmDeal.aggregate({
        where: { organizationId: tenantId, stage: { notIn: ["WON", "LOST"] } },
        _sum: { value: true },
        _count: { _all: true },
      }),
      prisma.crmDeal.aggregate({
        where: { organizationId: tenantId, stage: "WON", updatedAt: { gte: monthStart, lt: monthEnd } },
        _sum: { value: true },
        _count: { _all: true },
      }),
      prisma.itRequest.count({
        where: { organizationId: tenantId, status: { in: ["OPEN", "IN_PROGRESS"] } },
      }),
      prisma.crmDeal.findMany({
        where: { organizationId: tenantId },
        orderBy: { updatedAt: "desc" },
        take: 3,
        select: { title: true, stage: true, value: true, updatedAt: true },
      }),
    ]);

    const activity = [
      ...recentLeaves.map((l) => ({
        department: "HR",
        label: `${l.employee.firstName} ${l.employee.lastName} — ${l.leaveType.toLowerCase()} leave (${l.status.toLowerCase()})`,
        time: l.createdAt.toISOString(),
        dot: "bg-blue-400",
      })),
      ...recentPayroll.map((p) => ({
        department: "Payroll",
        label: `Payroll run #${p.runNumber} ${p.status.toLowerCase()} · ₱${Number(p.totalNet).toLocaleString()}`,
        time: p.createdAt.toISOString(),
        dot: "bg-emerald-400",
      })),
      ...recentInvoices.map((i) => ({
        department: "Finance",
        label: `Invoice ${i.invoiceNumber} — ${i.customerName} · ₱${Number(i.totalAmount).toLocaleString()}`,
        time: i.createdAt.toISOString(),
        dot: "bg-amber-400",
      })),
      ...recentRepairs.map((r) => ({
        department: "IT/Ops",
        label: `Repair: ${r.itemName} (${r.status.toLowerCase()})`,
        time: r.createdAt.toISOString(),
        dot: "bg-rose-400",
      })),
      ...recentDeals.map((d) => ({
        department: "Sales",
        label: `Deal: ${d.title} — ${d.stage.toLowerCase()}${d.value ? ` · ₱${Number(d.value).toLocaleString()}` : ""}`,
        time: d.updatedAt.toISOString(),
        dot: "bg-violet-400",
      })),
    ]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 8);

    const presentToday = attendanceToday.find((a) => a.status === "PRESENT")?._count._all ?? 0;
    const absentToday  = attendanceToday.find((a) => a.status === "ABSENT")?._count._all  ?? 0;

    const data = {
      hr: { activeEmployees, pendingLeaves, presentToday, absentToday },
      payroll: {
        lastRun: lastPayrollRun
          ? {
              status: lastPayrollRun.status,
              periodStart: lastPayrollRun.periodStart,
              periodEnd:   lastPayrollRun.periodEnd,
              totalNet:    Number(lastPayrollRun.totalNet),
              employeeCount: lastPayrollRun._count.lines,
            }
          : null,
      },
      finance: {
        totalBankBalance:  Number(bankAgg._sum.currentBalance ?? 0),
        bankAccountCount:  bankAgg._count._all,
        openReceivables:   Number(openInvoiceAgg._sum.totalAmount ?? 0) - Number(openInvoiceAgg._sum.paidAmount ?? 0),
        openInvoiceCount:  openInvoiceAgg._count._all,
        expensesThisMonth: Number(expenseAgg._sum.totalAmount ?? 0),
      },
      training:   { activeCourses, activeEnrollments },
      operations: { pendingRepairs },
      sales: {
        pipelineValue:    Number(salesPipelineAgg._sum.value ?? 0),
        activeDeals:      salesPipelineAgg._count._all,
        wonThisMonth:     salesWonThisMonth._count._all,
        revenueThisMonth: Number(salesWonThisMonth._sum.value ?? 0),
      },
      it: { openRequests: openItRequests },
      activity,
    };

    cache.set(tenantId, { data, expiresAt: Date.now() + TTL });
    return NextResponse.json({ success: true, data, error: null });
  } catch (err) {
    console.error("[GET /api/admin/executive/overview]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
