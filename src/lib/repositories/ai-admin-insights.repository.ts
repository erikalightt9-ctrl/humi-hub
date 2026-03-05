import { prisma } from "@/lib/prisma";
import type {
  PerformanceOverviewData,
  TopPerformer,
  AtRiskStudent,
  CourseMetric,
} from "@/lib/types/ai.types";

const AT_RISK_THRESHOLD_DAYS = 7;

/* ------------------------------------------------------------------ */
/*  Performance overview                                               */
/* ------------------------------------------------------------------ */

export async function getPerformanceOverview(): Promise<PerformanceOverviewData> {
  const [totalStudents, activeCourses] = await Promise.all([
    prisma.student.count({ where: { accessGranted: true } }),
    prisma.course.findMany({
      where: { isActive: true },
      select: { id: true, title: true },
    }),
  ]);

  const [topPerformers, atRiskStudents, courseMetrics] = await Promise.all([
    getTopPerformers(),
    getAtRiskStudents(),
    getCourseMetrics(activeCourses),
  ]);

  return {
    totalStudents,
    totalCourses: activeCourses.length,
    topPerformers,
    atRiskStudents,
    courseMetrics,
  };
}

/* ------------------------------------------------------------------ */
/*  Top performers                                                     */
/* ------------------------------------------------------------------ */

async function getTopPerformers(): Promise<ReadonlyArray<TopPerformer>> {
  const students = await prisma.student.findMany({
    where: { accessGranted: true },
    select: {
      id: true,
      name: true,
      enrollment: {
        select: {
          courseId: true,
          course: { select: { title: true } },
        },
      },
      _count: { select: { badges: true } },
    },
  });

  const performers = await Promise.all(
    students.map(async (s) => {
      const [pointsAgg, quizAgg] = await Promise.all([
        prisma.pointTransaction.aggregate({
          where: { studentId: s.id },
          _sum: { points: true },
        }),
        prisma.quizAttempt.aggregate({
          where: { studentId: s.id, quiz: { courseId: s.enrollment.courseId } },
          _avg: { score: true },
        }),
      ]);

      return {
        studentId: s.id,
        studentName: s.name,
        courseTitle: s.enrollment.course.title,
        totalPoints: pointsAgg._sum.points ?? 0,
        quizAverage: Math.round(quizAgg._avg.score ?? 0),
        badgeCount: s._count.badges,
      };
    }),
  );

  return [...performers]
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, 5);
}

/* ------------------------------------------------------------------ */
/*  At-risk students                                                   */
/* ------------------------------------------------------------------ */

async function getAtRiskStudents(): Promise<ReadonlyArray<AtRiskStudent>> {
  const sevenDaysAgo = new Date(
    Date.now() - AT_RISK_THRESHOLD_DAYS * 24 * 60 * 60 * 1000,
  );

  const students = await prisma.student.findMany({
    where: { accessGranted: true },
    select: {
      id: true,
      name: true,
      enrollment: {
        select: {
          courseId: true,
          course: {
            select: {
              title: true,
              lessons: { where: { isPublished: true }, select: { id: true } },
            },
          },
        },
      },
    },
  });

  const atRisk: AtRiskStudent[] = [];

  for (const s of students) {
    const lastActivities = await prisma.$queryRaw<
      ReadonlyArray<{ last_active: Date | null }>
    >`
      SELECT GREATEST(
        (SELECT MAX("completedAt") FROM lesson_completions
         WHERE "studentId" = ${s.id}),
        (SELECT MAX("completedAt") FROM quiz_attempts
         WHERE "studentId" = ${s.id}),
        (SELECT MAX("submittedAt") FROM submissions
         WHERE "studentId" = ${s.id}),
        (SELECT MAX("createdAt") FROM forum_posts
         WHERE "studentId" = ${s.id})
      ) as last_active
    `;

    const lastActive = lastActivities[0]?.last_active;

    if (!lastActive || lastActive < sevenDaysAgo) {
      const daysSince = lastActive
        ? Math.floor(
            (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24),
          )
        : 999;

      const lessonsCompleted = await prisma.lessonCompletion.count({
        where: {
          studentId: s.id,
          lesson: { courseId: s.enrollment.courseId },
        },
      });

      atRisk.push({
        studentId: s.id,
        studentName: s.name,
        courseTitle: s.enrollment.course.title,
        daysSinceActive: daysSince,
        lessonsCompleted,
        totalLessons: s.enrollment.course.lessons.length,
      });
    }
  }

  return [...atRisk]
    .sort((a, b) => b.daysSinceActive - a.daysSinceActive)
    .slice(0, 10);
}

/* ------------------------------------------------------------------ */
/*  Course metrics                                                     */
/* ------------------------------------------------------------------ */

async function getCourseMetrics(
  courses: ReadonlyArray<{ id: string; title: string }>,
): Promise<ReadonlyArray<CourseMetric>> {
  return Promise.all(
    courses.map(async (course) => {
      const [enrolledCount, totalLessons, completionCount, quizAgg, totalAssignments, submissionCount] =
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
          prisma.assignment.count({
            where: { courseId: course.id },
          }),
          prisma.submission.count({
            where: { assignment: { courseId: course.id } },
          }),
        ]);

      const possibleCompletions = enrolledCount * totalLessons;
      const completionRate =
        possibleCompletions > 0
          ? Math.round((completionCount / possibleCompletions) * 100)
          : 0;

      const possibleSubmissions = enrolledCount * totalAssignments;
      const submissionRate =
        possibleSubmissions > 0
          ? Math.round((submissionCount / possibleSubmissions) * 100)
          : 0;

      return {
        courseId: course.id,
        courseTitle: course.title,
        enrolledCount,
        avgQuizScore: Math.round(quizAgg._avg.score ?? 0),
        completionRate,
        submissionRate,
      };
    }),
  );
}
