import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

const CERT_THRESHOLD = 75; // percent

function generateSessionDates(start: Date, end: Date, days: number[]): string[] {
  const dates: string[] = [];
  const cur = new Date(start);
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  while (cur <= end) {
    if (days.includes(cur.getDay())) {
      dates.push(cur.toISOString().slice(0, 10));
    }
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { id } = await params;

    const schedule = await prisma.schedule.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, title: true, slug: true } },
        trainer: { select: { id: true, name: true } },
        students: {
          select: { id: true, name: true, email: true },
          orderBy: { name: "asc" },
        },
      },
    });

    if (!schedule) {
      return NextResponse.json(
        { success: false, data: null, error: "Schedule not found" },
        { status: 404 }
      );
    }

    const sessionDates = generateSessionDates(
      schedule.startDate,
      schedule.endDate,
      schedule.daysOfWeek
    );

    // Fetch all attendance records for this schedule
    const records = await prisma.sessionAttendance.findMany({
      where: { scheduleId: id },
      select: { studentId: true, sessionDate: true, present: true, notes: true },
    });

    // Build attendance map: attendance[studentId][dateStr]
    const attendance: Record<string, Record<string, { present: boolean; notes: string | null }>> = {};
    for (const r of records) {
      const dateStr = r.sessionDate.toISOString().slice(0, 10);
      if (!attendance[r.studentId]) attendance[r.studentId] = {};
      attendance[r.studentId][dateStr] = { present: r.present, notes: r.notes };
    }

    // Fetch existing certificates for this course
    const certStudentIds = new Set(
      (await prisma.certificate.findMany({
        where: { courseId: schedule.course.id },
        select: { studentId: true },
      })).map((c) => c.studentId)
    );

    // Per-student summaries
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const pastDates = sessionDates.filter((d) => new Date(d) <= today);

    const summaries = schedule.students.map((st) => {
      const studentAtt = attendance[st.id] ?? {};
      const presentCount = pastDates.filter((d) => studentAtt[d]?.present === true).length;
      const totalSessions = pastDates.length;
      const attendancePct = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;
      return {
        studentId: st.id,
        presentCount,
        totalSessions,
        attendancePct,
        isEligible: attendancePct >= CERT_THRESHOLD,
        hasCert: certStudentIds.has(st.id),
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        schedule: {
          id: schedule.id,
          name: schedule.name,
          course: schedule.course,
          trainer: schedule.trainer,
          startDate: schedule.startDate.toISOString().slice(0, 10),
          endDate: schedule.endDate.toISOString().slice(0, 10),
          daysOfWeek: schedule.daysOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          maxCapacity: schedule.maxCapacity,
          status: schedule.status,
        },
        sessionDates,
        students: schedule.students,
        attendance,
        summaries,
        certThreshold: CERT_THRESHOLD,
      },
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/admin/training-center/schedules/[id]/grid]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
