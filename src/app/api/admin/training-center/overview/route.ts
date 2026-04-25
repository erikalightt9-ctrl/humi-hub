import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

function generateSessionDates(start: Date, end: Date, days: number[]): Date[] {
  const dates: Date[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    if (days.includes(cur.getDay())) dates.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    const todayDay = today.getDay();

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [activeSchedules, allCerts, monthCerts, attSummaries] = await Promise.all([
      prisma.schedule.findMany({
        where: { status: { in: ["OPEN", "FULL"] } },
        select: {
          id: true,
          daysOfWeek: true,
          startDate: true,
          endDate: true,
          maxCapacity: true,
          _count: { select: { students: true } },
          students: { select: { id: true } },
        },
      }),
      prisma.certificate.count(),
      prisma.certificate.count({ where: { issuedAt: { gte: monthStart } } }),
      prisma.$queryRaw<{ schedule_id: string; present_count: bigint; total_count: bigint }[]>`
        SELECT
          "scheduleId" AS schedule_id,
          COUNT(*) FILTER (WHERE present = true) AS present_count,
          COUNT(*) AS total_count
        FROM session_attendances
        GROUP BY "scheduleId"
      `,
    ]);

    const todaySessions = activeSchedules.filter(
      (s) => s.daysOfWeek.includes(todayDay) && s.startDate <= today && s.endDate >= today
    ).length;

    const uniqueStudentIds = new Set(activeSchedules.flatMap((s) => s.students.map((st) => st.id)));
    const totalParticipants = uniqueStudentIds.size;

    // Overall attendance rate from existing records
    const totalPresent = attSummaries.reduce((sum, r) => sum + Number(r.present_count), 0);
    const totalRecords = attSummaries.reduce((sum, r) => sum + Number(r.total_count), 0);
    const attendanceRate = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;

    // Count students below 75% threshold
    const studentSummaries = await prisma.$queryRaw<{ student_id: string; present_count: bigint; total_count: bigint }[]>`
      SELECT
        "studentId" AS student_id,
        COUNT(*) FILTER (WHERE present = true) AS present_count,
        COUNT(*) AS total_count
      FROM session_attendances
      GROUP BY "studentId"
    `;

    const lowAttendanceCount = studentSummaries.filter(
      (r) => Number(r.total_count) > 0 && Number(r.present_count) / Number(r.total_count) < 0.75
    ).length;

    return NextResponse.json({
      success: true,
      data: {
        activeBatches: activeSchedules.length,
        totalParticipants,
        todaySessions,
        attendanceRate,
        certsIssued: allCerts,
        certsIssuedThisMonth: monthCerts,
        lowAttendanceCount,
      },
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/admin/training-center/overview]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
