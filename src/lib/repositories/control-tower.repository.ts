import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface StudentAnalyticsRow {
  readonly studentId: string;
  readonly studentName: string;
  readonly courseTitle: string;
  readonly enrollmentDate: Date;
  readonly lastActivityDate: Date | null;
  readonly lessonsCompleted: number;
  readonly totalLessons: number;
  readonly quizAverage: number;
  readonly attendanceCount: number;
  readonly totalPoints: number;
  readonly badgesCount: number;
  readonly submissionCount: number;
}

export interface CourseAggregate {
  readonly courseId: string;
  readonly courseTitle: string;
  readonly enrolledCount: number;
  readonly avgCompletionPercent: number;
  readonly avgQuizScore: number;
}

export interface PlatformStats {
  readonly totalStudents: number;
  readonly activeStudents: number;
  readonly inactiveStudents: number;
}

export interface ControlTowerData {
  readonly students: ReadonlyArray<StudentAnalyticsRow>;
  readonly courseAggregates: ReadonlyArray<CourseAggregate>;
  readonly platformStats: PlatformStats;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const ACTIVE_THRESHOLD_DAYS = 7;
const INACTIVE_THRESHOLD_DAYS = 14;

/* ------------------------------------------------------------------ */
/*  Main query                                                         */
/* ------------------------------------------------------------------ */

export async function getControlTowerData(): Promise<ControlTowerData> {
  const [students, courseAggregates, platformStats] = await Promise.all([
    getStudentAnalytics(),
    getCourseAggregates(),
    getPlatformStats(),
  ]);

  return { students, courseAggregates, platformStats };
}

/* ------------------------------------------------------------------ */
/*  Student-level analytics                                            */
/* ------------------------------------------------------------------ */

async function getStudentAnalytics(): Promise<
  ReadonlyArray<StudentAnalyticsRow>
> {
  const students = await prisma.student.findMany({
    where: { accessGranted: true },
    select: {
      id: true,
      name: true,
      createdAt: true,
      enrollment: {
        select: {
          courseId: true,
          createdAt: true,
          course: {
            select: {
              title: true,
              lessons: {
                where: { isPublished: true },
                select: { id: true },
              },
            },
          },
        },
      },
      _count: {
        select: {
          badges: true,
          submissions: true,
        },
      },
    },
  });

  const rows = await Promise.all(
    students.map(async (s) => {
      const [lastActivity, lessonsCompleted, quizAgg, attendanceCount, pointsAgg] =
        await Promise.all([
          getLastActivityDate(s.id),
          prisma.lessonCompletion.count({
            where: {
              studentId: s.id,
              lesson: { courseId: s.enrollment.courseId },
            },
          }),
          prisma.quizAttempt.aggregate({
            where: {
              studentId: s.id,
              quiz: { courseId: s.enrollment.courseId },
            },
            _avg: { score: true },
          }),
          prisma.attendanceRecord.count({
            where: { studentId: s.id },
          }),
          prisma.pointTransaction.aggregate({
            where: { studentId: s.id },
            _sum: { points: true },
          }),
        ]);

      return {
        studentId: s.id,
        studentName: s.name,
        courseTitle: s.enrollment.course.title,
        enrollmentDate: s.enrollment.createdAt,
        lastActivityDate: lastActivity,
        lessonsCompleted,
        totalLessons: s.enrollment.course.lessons.length,
        quizAverage: Math.round(quizAgg._avg.score ?? 0),
        attendanceCount,
        totalPoints: pointsAgg._sum.points ?? 0,
        badgesCount: s._count.badges,
        submissionCount: s._count.submissions,
      };
    }),
  );

  return rows;
}

/* ------------------------------------------------------------------ */
/*  Last activity helper                                               */
/* ------------------------------------------------------------------ */

async function getLastActivityDate(
  studentId: string,
): Promise<Date | null> {
  const result = await prisma.$queryRaw<
    ReadonlyArray<{ last_active: Date | null }>
  >`
    SELECT GREATEST(
      (SELECT MAX("completedAt") FROM lesson_completions
       WHERE "studentId" = ${studentId}),
      (SELECT MAX("completedAt") FROM quiz_attempts
       WHERE "studentId" = ${studentId}),
      (SELECT MAX("clockIn") FROM attendance_records
       WHERE "studentId" = ${studentId}),
      (SELECT MAX("submittedAt") FROM submissions
       WHERE "studentId" = ${studentId})
    ) as last_active
  `;

  return result[0]?.last_active ?? null;
}

/* ------------------------------------------------------------------ */
/*  Course aggregates                                                  */
/* ------------------------------------------------------------------ */

async function getCourseAggregates(): Promise<
  ReadonlyArray<CourseAggregate>
> {
  const courses = await prisma.course.findMany({
    where: { isActive: true },
    select: { id: true, title: true },
  });

  return Promise.all(
    courses.map(async (course) => {
      const [enrolledCount, totalLessons, completionCount, quizAgg] =
        await Promise.all([
          prisma.enrollment.count({
            where: { courseId: course.id, status: "APPROVED" },
          }),
          prisma.lesson.count({
            where: { courseId: course.id, isPublished: true },
          }),
          prisma.lessonCompletion.count({
            where: { lesson: { courseId: course.id } },
          }),
          prisma.quizAttempt.aggregate({
            where: { quiz: { courseId: course.id } },
            _avg: { score: true },
          }),
        ]);

      const possibleCompletions = enrolledCount * totalLessons;
      const avgCompletionPercent =
        possibleCompletions > 0
          ? Math.round((completionCount / possibleCompletions) * 100)
          : 0;

      return {
        courseId: course.id,
        courseTitle: course.title,
        enrolledCount,
        avgCompletionPercent,
        avgQuizScore: Math.round(quizAgg._avg.score ?? 0),
      };
    }),
  );
}

/* ------------------------------------------------------------------ */
/*  Platform-wide stats                                                */
/* ------------------------------------------------------------------ */

async function getPlatformStats(): Promise<PlatformStats> {
  const now = Date.now();
  const sevenDaysAgo = new Date(
    now - ACTIVE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000,
  );
  const fourteenDaysAgo = new Date(
    now - INACTIVE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000,
  );

  const totalStudents = await prisma.student.count({
    where: { accessGranted: true },
  });

  // Active: any activity in the last 7 days
  const activeResults = await prisma.$queryRaw<
    ReadonlyArray<{ count: bigint }>
  >`
    SELECT COUNT(DISTINCT s.id) as count
    FROM students s
    WHERE s."accessGranted" = true
    AND (
      EXISTS (SELECT 1 FROM lesson_completions lc
              WHERE lc."studentId" = s.id
              AND lc."completedAt" >= ${sevenDaysAgo})
      OR EXISTS (SELECT 1 FROM quiz_attempts qa
                 WHERE qa."studentId" = s.id
                 AND qa."completedAt" >= ${sevenDaysAgo})
      OR EXISTS (SELECT 1 FROM attendance_records ar
                 WHERE ar."studentId" = s.id
                 AND ar."clockIn" >= ${sevenDaysAgo})
      OR EXISTS (SELECT 1 FROM submissions sub
                 WHERE sub."studentId" = s.id
                 AND sub."submittedAt" >= ${sevenDaysAgo})
    )
  `;

  // Inactive: no activity in 14+ days
  const inactiveResults = await prisma.$queryRaw<
    ReadonlyArray<{ count: bigint }>
  >`
    SELECT COUNT(DISTINCT s.id) as count
    FROM students s
    WHERE s."accessGranted" = true
    AND NOT EXISTS (
      SELECT 1 FROM lesson_completions lc
      WHERE lc."studentId" = s.id
      AND lc."completedAt" >= ${fourteenDaysAgo}
    )
    AND NOT EXISTS (
      SELECT 1 FROM quiz_attempts qa
      WHERE qa."studentId" = s.id
      AND qa."completedAt" >= ${fourteenDaysAgo}
    )
    AND NOT EXISTS (
      SELECT 1 FROM attendance_records ar
      WHERE ar."studentId" = s.id
      AND ar."clockIn" >= ${fourteenDaysAgo}
    )
    AND NOT EXISTS (
      SELECT 1 FROM submissions sub
      WHERE sub."studentId" = s.id
      AND sub."submittedAt" >= ${fourteenDaysAgo}
    )
  `;

  const activeStudents = Number(activeResults[0]?.count ?? 0);
  const inactiveStudents = Number(inactiveResults[0]?.count ?? 0);

  return { totalStudents, activeStudents, inactiveStudents };
}
