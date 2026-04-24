import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const now = new Date();

    // All active employees + today's attendance log
    const employees = await prisma.hrEmployee.findMany({
      where: { organizationId: guard.tenantId, status: "ACTIVE" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        position: true,
        department: true,
        avatarUrl: true,
        attendance: {
          where: { date: today },
          select: {
            id: true,
            clockIn: true,
            clockOut: true,
            hoursWorked: true,
            overtimeHours: true,
            status: true,
            clockInPhotoUrl: true,
            clockInLatitude: true,
            clockInLongitude: true,
            notes: true,
          },
          take: 1,
        },
      },
      orderBy: [{ department: "asc" }, { lastName: "asc" }],
    });

    const data = employees.map((emp) => {
      const log = emp.attendance[0] ?? null;
      const isCurrentlyIn = !!log?.clockIn && !log?.clockOut;
      const elapsedMinutes = isCurrentlyIn && log?.clockIn
        ? Math.floor((now.getTime() - new Date(log.clockIn).getTime()) / 60000)
        : null;

      return {
        id: emp.id,
        name: `${emp.firstName} ${emp.lastName}`,
        position: emp.position,
        department: emp.department ?? "—",
        avatarUrl: emp.avatarUrl,
        clockIn: log?.clockIn ?? null,
        clockOut: log?.clockOut ?? null,
        hoursWorked: log?.hoursWorked ? Number(log.hoursWorked) : null,
        overtimeHours: log?.overtimeHours ? Number(log.overtimeHours) : null,
        status: log?.status ?? "ABSENT",
        photoUrl: log?.clockInPhotoUrl ?? null,
        isCurrentlyIn,
        elapsedMinutes,
        notes: log?.notes ?? null,
      };
    });

    // Group for summary
    const currentlyIn = data.filter((e) => e.isCurrentlyIn && e.status !== "LATE").length;
    const late = data.filter((e) => e.isCurrentlyIn && e.status === "LATE").length;
    const completed = data.filter((e) => !!e.clockOut).length;
    const absent = data.filter((e) => !e.clockIn).length;

    return NextResponse.json({
      success: true,
      data: {
        employees: data,
        summary: { currentlyIn, late, completed, absent, total: data.length },
        asOf: now.toISOString(),
      },
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/admin/hr/attendance/live]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
