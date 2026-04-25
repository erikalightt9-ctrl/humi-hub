import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const tenantId = guard.tenantId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const now = new Date();

    const [
      attendanceToday,
      allActiveEmployees,
      openTasks,
      lowStockItems,
      openRepairs,
      pendingLeave,
      draftPayroll,
      openTickets,
    ] = await Promise.all([
      // Today's attendance logs with clockIn but no clockOut (or any clockIn)
      prisma.hrAttendanceLog.findMany({
        where: { employee: { organizationId: tenantId }, date: today },
        select: {
          status: true,
          clockIn: true,
          clockOut: true,
          employee: { select: { firstName: true, lastName: true, department: true } },
        },
      }),

      // Total active employees
      prisma.hrEmployee.count({
        where: { organizationId: tenantId, status: "ACTIVE" },
      }),

      // Open tasks (not DONE)
      prisma.organizationTask.findMany({
        where: { organizationId: tenantId, status: { not: "DONE" } },
        select: { id: true, title: true, status: true, priority: true, assigneeName: true, dueDate: true },
        orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
        take: 10,
      }),

      // Low stock items — raw query to compare column to column
      prisma.$queryRaw<Array<{ id: string; name: string; totalStock: number; minThreshold: number; unit: string; categoryId: string | null }>>`
        SELECT id, name, "totalStock", "minThreshold", unit, "categoryId"
        FROM inventory_items
        WHERE "organizationId" = ${tenantId}
          AND "minThreshold" > 0
          AND "totalStock" <= "minThreshold"
        ORDER BY ("totalStock"::float / "minThreshold"::float) ASC
        LIMIT 10
      `.then(async (rows) => {
        const catIds = [...new Set(rows.map((r) => r.categoryId).filter(Boolean))] as string[];
        const cats = catIds.length > 0
          ? await prisma.inventoryCategory.findMany({ where: { id: { in: catIds } }, select: { id: true, name: true, icon: true } })
          : [];
        const catMap = new Map(cats.map((c) => [c.id, c]));
        return rows.map((r) => ({ ...r, category: r.categoryId ? (catMap.get(r.categoryId) ?? null) : null }));
      }).catch(() => [] as Array<{ id: string; name: string; totalStock: number; minThreshold: number; unit: string; category: { id: string; name: string; icon: string | null } | null }>),

      // Open repair logs
      prisma.adminRepairLog.findMany({
        where: { organizationId: tenantId, status: { in: ["PENDING", "IN_PROGRESS"] } },
        select: { id: true, itemName: true, status: true, dateReported: true, technician: true },
        orderBy: { dateReported: "asc" },
        take: 10,
      }),

      // Pending leave requests
      prisma.hrLeaveRequest.count({
        where: { employee: { organizationId: tenantId }, status: "PENDING" },
      }),

      // Draft payroll runs
      prisma.hrPayrollRun.count({
        where: { organizationId: tenantId, status: "DRAFT" },
      }),

      // Open support tickets
      prisma.supportTicket.count({
        where: { status: "OPEN" },
      }),
    ]);

    // Attendance breakdown
    const currentlyIn = attendanceToday.filter((a) => a.clockIn && !a.clockOut).length;
    const lateCount = attendanceToday.filter((a) => a.status === "LATE").length;
    const completedCount = attendanceToday.filter((a) => a.clockOut).length;
    const absentCount = allActiveEmployees - attendanceToday.length;

    // Low stock — handle prisma raw query fallback
    const lowStock = Array.isArray(lowStockItems) ? lowStockItems : [];

    return NextResponse.json({
      success: true,
      data: {
        attendance: {
          currentlyIn,
          late: lateCount,
          completed: completedCount,
          absent: Math.max(0, absentCount),
          total: allActiveEmployees,
        },
        tasks: {
          items: openTasks,
          openCount: openTasks.length,
          byStatus: {
            TODO: openTasks.filter((t) => t.status === "TODO").length,
            IN_PROGRESS: openTasks.filter((t) => t.status === "IN_PROGRESS").length,
            BLOCKED: openTasks.filter((t) => t.status === "BLOCKED").length,
          },
        },
        inventory: {
          lowStockCount: lowStock.length,
          items: lowStock.slice(0, 5),
        },
        repairs: {
          openCount: openRepairs.length,
          items: openRepairs,
        },
        pendingLeave,
        draftPayroll,
        openTickets,
        asOf: now.toISOString(),
      },
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/admin/operations/dashboard]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
