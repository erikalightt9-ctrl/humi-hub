import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface AttendanceSession {
  readonly id: string;
  readonly studentId: string;
  readonly courseId: string | null;
  readonly clockIn: Date;
  readonly clockOut: Date | null;
  readonly durationMinutes: number | null;
}

export interface AttendanceRow {
  readonly id: string;
  readonly studentName: string;
  readonly courseTitle: string;
  readonly clockIn: string;
  readonly clockOut: string | null;
  readonly durationMinutes: number | null;
  readonly isActive: boolean;
}

export interface AttendanceSummary {
  readonly presentNow: number;
  readonly clockedOutToday: number;
  readonly totalToday: number;
  readonly records: ReadonlyArray<AttendanceRow>;
}

export interface CourseAttendanceRow {
  readonly id: string;
  readonly studentId: string;
  readonly studentName: string;
  readonly clockIn: string;
  readonly clockOut: string | null;
  readonly durationMinutes: number | null;
  readonly isActive: boolean;
}

export interface AttendanceDailyStat {
  readonly date: string;
  readonly count: number;
  readonly avgDurationMinutes: number | null;
}

export interface AttendanceAnalytics {
  readonly totalCheckIns: number;
  readonly uniqueStudents: number;
  readonly enrolledStudents: number;
  readonly attendanceRate: number;
  readonly avgDurationMinutes: number | null;
  readonly daily: ReadonlyArray<AttendanceDailyStat>;
  readonly topStudents: ReadonlyArray<{
    readonly studentId: string;
    readonly studentName: string;
    readonly checkIns: number;
    readonly totalMinutes: number;
  }>;
}

/* ------------------------------------------------------------------ */
/*  Student-facing (global — no course scope)                         */
/* ------------------------------------------------------------------ */

/** Find a student's open (not clocked-out) session — any course */
export async function getActiveSession(
  studentId: string,
): Promise<AttendanceSession | null> {
  return prisma.attendanceRecord.findFirst({
    where: { studentId, clockOut: null },
    orderBy: { clockIn: "desc" },
  });
}

/** Clock a student IN (legacy, no course scope) */
export async function clockIn(studentId: string): Promise<AttendanceSession> {
  return prisma.attendanceRecord.create({
    data: { studentId },
  });
}

/** Clock a student OUT — stamps clockOut + computes duration */
export async function clockOut(
  studentId: string,
  recordId: string,
): Promise<AttendanceSession> {
  const now = new Date();
  const record = await prisma.attendanceRecord.findUnique({
    where: { id: recordId, studentId },
  });

  const durationMinutes = record
    ? Math.floor((now.getTime() - record.clockIn.getTime()) / 60_000)
    : null;

  return prisma.attendanceRecord.update({
    where: { id: recordId, studentId },
    data: { clockOut: now, durationMinutes },
  });
}

/* ------------------------------------------------------------------ */
/*  Student-facing (course-scoped)                                    */
/* ------------------------------------------------------------------ */

/** Find a student's open session for a specific course */
export async function getActiveSessionForCourse(
  studentId: string,
  courseId: string,
): Promise<AttendanceSession | null> {
  return prisma.attendanceRecord.findFirst({
    where: { studentId, courseId, clockOut: null },
    orderBy: { clockIn: "desc" },
  });
}

/** Clock a student IN for a specific course */
export async function clockInForCourse(
  studentId: string,
  courseId: string,
): Promise<AttendanceSession> {
  return prisma.attendanceRecord.create({
    data: { studentId, courseId },
  });
}

/** Clock a student OUT for a specific course session */
export async function clockOutForCourse(
  studentId: string,
  recordId: string,
): Promise<AttendanceSession> {
  const now = new Date();
  const record = await prisma.attendanceRecord.findUnique({
    where: { id: recordId, studentId },
  });

  const durationMinutes = record
    ? Math.floor((now.getTime() - record.clockIn.getTime()) / 60_000)
    : null;

  return prisma.attendanceRecord.update({
    where: { id: recordId, studentId },
    data: { clockOut: now, durationMinutes },
  });
}

/* ------------------------------------------------------------------ */
/*  Trainer-facing (course-scoped live view)                          */
/* ------------------------------------------------------------------ */

/**
 * Get all attendance records for a course.
 * Optionally filter to only active (currently clocked-in) students.
 */
export async function getAttendanceByCourse(
  courseId: string,
  opts: { activeOnly?: boolean } = {},
): Promise<ReadonlyArray<CourseAttendanceRow>> {
  const records = await prisma.attendanceRecord.findMany({
    where: {
      courseId,
      ...(opts.activeOnly ? { clockOut: null } : {}),
    },
    include: {
      student: { select: { name: true } },
    },
    orderBy: { clockIn: "desc" },
  });

  return records.map((r) => ({
    id: r.id,
    studentId: r.studentId,
    studentName: r.student.name,
    clockIn: r.clockIn.toISOString(),
    clockOut: r.clockOut?.toISOString() ?? null,
    durationMinutes: r.durationMinutes,
    isActive: r.clockOut === null,
  }));
}

/* ------------------------------------------------------------------ */
/*  Admin-facing (analytics)                                          */
/* ------------------------------------------------------------------ */

/**
 * Get attendance analytics for a course.
 * Includes totals, rate, avg duration, daily breakdown (last 30 days), top students.
 */
export async function getAttendanceAnalyticsByCourse(
  courseId: string,
): Promise<AttendanceAnalytics> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const [allRecords, enrolledCount] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where: {
        courseId,
        clockIn: { gte: thirtyDaysAgo },
      },
      include: {
        student: { select: { name: true } },
      },
      orderBy: { clockIn: "asc" },
    }),
    prisma.enrollment.count({
      where: {
        courseId,
        status: "ENROLLED",
      },
    }),
  ]);

  const totalCheckIns = allRecords.length;
  const uniqueStudentIds = new Set(allRecords.map((r) => r.studentId));
  const uniqueStudents = uniqueStudentIds.size;
  const attendanceRate =
    enrolledCount > 0
      ? Math.round((uniqueStudents / enrolledCount) * 100)
      : 0;

  // Average duration (completed sessions only)
  const completedRecords = allRecords.filter(
    (r) => r.durationMinutes !== null,
  );
  const avgDurationMinutes =
    completedRecords.length > 0
      ? Math.round(
          completedRecords.reduce((sum, r) => sum + (r.durationMinutes ?? 0), 0) /
            completedRecords.length,
        )
      : null;

  // Daily breakdown
  const dailyMap = new Map<string, { count: number; totalMin: number; completedCount: number }>();
  for (const r of allRecords) {
    const day = r.clockIn.toISOString().slice(0, 10); // YYYY-MM-DD
    const existing = dailyMap.get(day) ?? { count: 0, totalMin: 0, completedCount: 0 };
    dailyMap.set(day, {
      count: existing.count + 1,
      totalMin: existing.totalMin + (r.durationMinutes ?? 0),
      completedCount: existing.completedCount + (r.durationMinutes !== null ? 1 : 0),
    });
  }
  const daily: AttendanceDailyStat[] = Array.from(dailyMap.entries()).map(
    ([date, stats]) => ({
      date,
      count: stats.count,
      avgDurationMinutes:
        stats.completedCount > 0
          ? Math.round(stats.totalMin / stats.completedCount)
          : null,
    }),
  );

  // Top students by check-in count
  const studentMap = new Map<
    string,
    { name: string; checkIns: number; totalMinutes: number }
  >();
  for (const r of allRecords) {
    const existing = studentMap.get(r.studentId) ?? {
      name: r.student.name,
      checkIns: 0,
      totalMinutes: 0,
    };
    studentMap.set(r.studentId, {
      name: existing.name,
      checkIns: existing.checkIns + 1,
      totalMinutes: existing.totalMinutes + (r.durationMinutes ?? 0),
    });
  }
  const topStudents = Array.from(studentMap.entries())
    .map(([studentId, s]) => ({
      studentId,
      studentName: s.name,
      checkIns: s.checkIns,
      totalMinutes: s.totalMinutes,
    }))
    .sort((a, b) => b.checkIns - a.checkIns)
    .slice(0, 10);

  return {
    totalCheckIns,
    uniqueStudents,
    enrolledStudents: enrolledCount,
    attendanceRate,
    avgDurationMinutes,
    daily,
    topStudents,
  };
}

/* ------------------------------------------------------------------ */
/*  Admin-facing (global date view — unchanged)                       */
/* ------------------------------------------------------------------ */

/** Get attendance records for a specific date (defaults to today) */
export async function getAttendanceByDate(
  date?: string,
): Promise<AttendanceSummary> {
  const targetDate = date ? new Date(date) : new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const records = await prisma.attendanceRecord.findMany({
    where: {
      clockIn: { gte: startOfDay, lte: endOfDay },
    },
    include: {
      student: {
        select: {
          name: true,
          enrollment: {
            select: { course: { select: { title: true } } },
          },
        },
      },
    },
    orderBy: { clockIn: "desc" },
  });

  const rows: AttendanceRow[] = records.map((r) => ({
    id: r.id,
    studentName: r.student.name,
    courseTitle: r.student.enrollment.course.title,
    clockIn: r.clockIn.toISOString(),
    clockOut: r.clockOut?.toISOString() ?? null,
    durationMinutes: r.durationMinutes,
    isActive: r.clockOut === null,
  }));

  const presentNow = rows.filter((r) => r.isActive).length;
  const clockedOutToday = rows.filter((r) => !r.isActive).length;

  return {
    presentNow,
    clockedOutToday,
    totalToday: rows.length,
    records: rows,
  };
}

/** Count students currently clocked in (for admin dashboard card) */
export async function getPresentNowCount(): Promise<number> {
  return prisma.attendanceRecord.count({
    where: { clockOut: null },
  });
}
