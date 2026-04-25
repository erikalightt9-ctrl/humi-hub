import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { tenantId } = guard;

    const [leaveRequests, payrollRuns, repairs] = await Promise.all([
      // Pending leave requests with employee info
      prisma.hrLeaveRequest.findMany({
        where: { employee: { organizationId: tenantId }, status: "PENDING" },
        include: {
          employee: {
            select: {
              id: true, firstName: true, lastName: true,
              employeeNumber: true, department: true, position: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
        take: 50,
      }),

      // Draft payroll runs
      prisma.hrPayrollRun.findMany({
        where: { organizationId: tenantId, status: "DRAFT" },
        select: {
          id: true, runNumber: true, periodStart: true, periodEnd: true,
          totalGross: true, totalDeductions: true, totalNet: true,
          notes: true, createdAt: true,
          _count: { select: { lines: true } },
        },
        orderBy: { createdAt: "asc" },
        take: 20,
      }),

      // Open repairs (PENDING + IN_PROGRESS)
      prisma.adminRepairLog.findMany({
        where: { organizationId: tenantId, status: { in: ["PENDING", "IN_PROGRESS"] } },
        select: {
          id: true, itemName: true, itemType: true, status: true,
          dateReported: true, description: true, technician: true,
          cost: true, notes: true,
        },
        orderBy: { dateReported: "asc" },
        take: 30,
      }),
    ]);

    const total = leaveRequests.length + payrollRuns.length + repairs.length;

    return NextResponse.json({
      success: true,
      data: { leaveRequests, payrollRuns, repairs, total },
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/admin/action-center]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
