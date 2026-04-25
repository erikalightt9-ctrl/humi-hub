import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== "employee") {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }

    const email = token.email as string;

    // Resolve employee record
    const employee = await prisma.hrEmployee.findFirst({
      where: { email },
      select: { id: true, firstName: true, lastName: true, organizationId: true },
    });

    if (!employee) {
      return NextResponse.json({ success: false, data: null, error: "Employee record not found" }, { status: 404 });
    }

    const { searchParams } = req.nextUrl;
    const statusFilter = searchParams.get("status") ?? undefined;

    const tasks = await prisma.organizationTask.findMany({
      where: {
        organizationId: employee.organizationId,
        assigneeId: employee.id,
        ...(statusFilter ? { status: statusFilter as never } : {}),
      },
      orderBy: [{ status: "asc" }, { priority: "desc" }, { dueDate: "asc" }],
    });

    // Today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayLog = await prisma.hrAttendanceLog.findUnique({
      where: { employeeId_date: { employeeId: employee.id, date: today } },
      select: { clockIn: true, clockOut: true, status: true, hoursWorked: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        employee: { id: employee.id, name: `${employee.firstName} ${employee.lastName}` },
        tasks,
        todayLog,
      },
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/employee/work]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
