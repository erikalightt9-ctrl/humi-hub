import { prisma } from "@/lib/prisma";
import type { SessionAttendance } from "@prisma/client";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type AttendanceRow = SessionAttendance & {
  student: {
    id: string;
    name: string;
    email: string;
  };
};

export type SessionSummary = {
  sessionDate: Date;
  presentCount: number;
  absentCount: number;
  totalStudents: number;
};

export type StudentAttendanceSummary = {
  studentId: string;
  studentName: string;
  studentEmail: string;
  presentCount: number;
  totalSessions: number;
  attendancePct: number;
};

/* ------------------------------------------------------------------ */
/*  Upsert a single attendance record                                  */
/* ------------------------------------------------------------------ */

export async function upsertAttendance(
  scheduleId: string,
  studentId: string,
  sessionDate: Date,
  present: boolean,
  notes?: string,
): Promise<SessionAttendance> {
  return prisma.sessionAttendance.upsert({
    where: {
      scheduleId_studentId_sessionDate: { scheduleId, studentId, sessionDate },
    },
    create: { scheduleId, studentId, sessionDate, present, notes },
    update: { present, notes },
  });
}

/* ------------------------------------------------------------------ */
/*  Bulk upsert for a full session date                                */
/* ------------------------------------------------------------------ */

export interface AttendanceUpsertItem {
  readonly studentId: string;
  readonly present: boolean;
  readonly notes?: string;
}

export async function upsertSessionAttendances(
  scheduleId: string,
  sessionDate: Date,
  items: ReadonlyArray<AttendanceUpsertItem>,
): Promise<void> {
  await Promise.all(
    items.map((item) =>
      upsertAttendance(scheduleId, item.studentId, sessionDate, item.present, item.notes),
    ),
  );
}

/* ------------------------------------------------------------------ */
/*  List all attendance records for a schedule + session date          */
/* ------------------------------------------------------------------ */

export async function listAttendanceBySession(
  scheduleId: string,
  sessionDate: Date,
): Promise<ReadonlyArray<AttendanceRow>> {
  return prisma.sessionAttendance.findMany({
    where: { scheduleId, sessionDate },
    include: {
      student: { select: { id: true, name: true, email: true } },
    },
    orderBy: { student: { name: "asc" } },
  });
}

/* ------------------------------------------------------------------ */
/*  List distinct session dates that have attendance records           */
/* ------------------------------------------------------------------ */

export async function listSessionDates(
  scheduleId: string,
): Promise<ReadonlyArray<Date>> {
  const rows = await prisma.sessionAttendance.findMany({
    where: { scheduleId },
    select: { sessionDate: true },
    distinct: ["sessionDate"],
    orderBy: { sessionDate: "asc" },
  });
  return rows.map((r) => r.sessionDate);
}

/* ------------------------------------------------------------------ */
/*  Per-student summary for a schedule                                  */
/* ------------------------------------------------------------------ */

export async function getStudentAttendanceSummaries(
  scheduleId: string,
): Promise<ReadonlyArray<StudentAttendanceSummary>> {
  const rows = await prisma.sessionAttendance.findMany({
    where: { scheduleId },
    include: {
      student: { select: { id: true, name: true, email: true } },
    },
  });

  const map = new Map<
    string,
    { name: string; email: string; present: number; total: number }
  >();

  for (const row of rows) {
    const entry = map.get(row.studentId) ?? {
      name: row.student.name,
      email: row.student.email,
      present: 0,
      total: 0,
    };
    entry.total += 1;
    if (row.present) entry.present += 1;
    map.set(row.studentId, entry);
  }

  return Array.from(map.entries()).map(([studentId, v]) => ({
    studentId,
    studentName: v.name,
    studentEmail: v.email,
    presentCount: v.present,
    totalSessions: v.total,
    attendancePct: v.total > 0 ? Math.round((v.present / v.total) * 100) : 0,
  }));
}
