import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface WorkPaceRawData {
  readonly studentName: string;
  readonly enrollmentDate: Date;
  readonly courseTitle: string;
  readonly courseSlug: string;
  readonly totalLessons: number;
  readonly courseDurationWeeks: number;
  readonly lessonCompletions: ReadonlyArray<{
    readonly id: string;
    readonly completedAt: Date;
    readonly lesson: {
      readonly title: string;
      readonly order: number;
    };
  }>;
  readonly quizAttempts: ReadonlyArray<{
    readonly id: string;
    readonly score: number;
    readonly passed: boolean;
    readonly completedAt: Date;
  }>;
  readonly attendanceRecords: ReadonlyArray<{
    readonly id: string;
    readonly clockIn: Date;
    readonly clockOut: Date | null;
    readonly createdAt: Date;
  }>;
  readonly scheduleDaysOfWeek: ReadonlyArray<number>;
}

/* ------------------------------------------------------------------ */
/*  Read — Aggregate all pace-related data for a student               */
/* ------------------------------------------------------------------ */

export async function getWorkPaceData(
  studentId: string,
): Promise<WorkPaceRawData | null> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      name: true,
      createdAt: true,
      scheduleId: true,
      enrollment: {
        select: {
          createdAt: true,
          courseId: true,
          course: {
            select: {
              title: true,
              slug: true,
              durationWeeks: true,
            },
          },
        },
      },
    },
  });

  if (!student) return null;

  const courseId = student.enrollment.courseId;

  const [lessonCompletions, quizAttempts, attendanceRecords, totalLessons, schedule] =
    await Promise.all([
      prisma.lessonCompletion.findMany({
        where: { studentId, lesson: { courseId, isPublished: true } },
        orderBy: { completedAt: "asc" },
        select: {
          id: true,
          completedAt: true,
          lesson: {
            select: {
              title: true,
              order: true,
            },
          },
        },
      }),

      prisma.quizAttempt.findMany({
        where: { studentId, quiz: { courseId } },
        orderBy: { completedAt: "asc" },
        select: {
          id: true,
          score: true,
          passed: true,
          completedAt: true,
        },
      }),

      prisma.attendanceRecord.findMany({
        where: { studentId },
        orderBy: { clockIn: "asc" },
        select: {
          id: true,
          clockIn: true,
          clockOut: true,
          createdAt: true,
        },
      }),

      prisma.lesson.count({
        where: { courseId, isPublished: true },
      }),

      student.scheduleId
        ? prisma.schedule.findUnique({
            where: { id: student.scheduleId },
            select: { daysOfWeek: true },
          })
        : null,
    ]);

  return {
    studentName: student.name,
    enrollmentDate: student.enrollment.createdAt,
    courseTitle: student.enrollment.course.title,
    courseSlug: String(student.enrollment.course.slug),
    totalLessons,
    courseDurationWeeks: student.enrollment.course.durationWeeks,
    lessonCompletions,
    quizAttempts,
    attendanceRecords,
    scheduleDaysOfWeek: schedule?.daysOfWeek ?? [1, 2, 3, 4, 5],
  };
}
