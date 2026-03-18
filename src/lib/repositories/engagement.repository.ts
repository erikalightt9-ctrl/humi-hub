import { prisma } from "@/lib/prisma";
import type {
  CourseEngagementMetrics,
  StudentEngagementRow,
  StudentEngagementResponse,
  EngagementStatus,
  EngagementQueryParams,
} from "@/lib/types/engagement.types";

const ACTIVE_THRESHOLD_DAYS = 7;
const AT_RISK_THRESHOLD_DAYS = 30;

function computeEngagementStatus(lastActiveAt: Date | null): EngagementStatus {
  if (!lastActiveAt) return "inactive";
  const daysSinceActive = Math.floor(
    (Date.now() - lastActiveAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceActive <= ACTIVE_THRESHOLD_DAYS) return "active";
  if (daysSinceActive <= AT_RISK_THRESHOLD_DAYS) return "at_risk";
  return "inactive";
}

export async function getCourseEngagementMetrics(
  tenantId?: string | null,
): Promise<ReadonlyArray<CourseEngagementMetrics>> {
  const activeCourses = await prisma.course.findMany({
    where: {
      isActive: true,
      ...(tenantId ? { tenantId } : {}),
    },
    select: { id: true, title: true },
  });

  const sevenDaysAgo = new Date(
    Date.now() - ACTIVE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000
  );

  const metrics = await Promise.all(
    activeCourses.map((course) =>
      buildCourseMetrics(course.id, course.title, sevenDaysAgo)
    )
  );

  return metrics;
}

async function buildCourseMetrics(
  courseId: string,
  courseTitle: string,
  sevenDaysAgo: Date
): Promise<CourseEngagementMetrics> {
  const [
    enrolledCount,
    totalLessons,
    completionCount,
    quizScoreAgg,
    totalAssignments,
    submissionCount,
    activeStudentResult,
    forumPostCount,
  ] = await Promise.all([
    prisma.enrollment.count({
      where: { courseId, status: "APPROVED" },
    }),

    prisma.lesson.count({
      where: { courseId, isPublished: true },
    }),

    prisma.lessonCompletion.count({
      where: { lesson: { courseId } },
    }),

    prisma.quizAttempt.aggregate({
      where: { quiz: { courseId } },
      _avg: { score: true },
    }),

    prisma.assignment.count({
      where: { courseId },
    }),

    prisma.submission.count({
      where: { assignment: { courseId } },
    }),

    prisma.$queryRaw<ReadonlyArray<{ count: bigint }>>`
      SELECT COUNT(DISTINCT "studentId") as count FROM (
        SELECT lc."studentId" FROM lesson_completions lc
          JOIN lessons l ON lc."lessonId" = l.id
          WHERE l."courseId" = ${courseId}
            AND lc."completedAt" >= ${sevenDaysAgo}
        UNION
        SELECT qa."studentId" FROM quiz_attempts qa
          JOIN quizzes q ON qa."quizId" = q.id
          WHERE q."courseId" = ${courseId}
            AND qa."completedAt" >= ${sevenDaysAgo}
        UNION
        SELECT s."studentId" FROM submissions s
          JOIN assignments a ON s."assignmentId" = a.id
          WHERE a."courseId" = ${courseId}
            AND s."submittedAt" >= ${sevenDaysAgo}
        UNION
        SELECT fp."studentId" FROM forum_posts fp
          JOIN forum_threads ft ON fp."threadId" = ft.id
          WHERE ft."courseId" = ${courseId}
            AND fp."createdAt" >= ${sevenDaysAgo}
      ) active_students
    `,

    prisma.forumPost.count({
      where: { thread: { courseId } },
    }),
  ]);

  const possibleCompletions = enrolledCount * totalLessons;
  const lessonCompletionRate =
    possibleCompletions > 0
      ? Math.round((completionCount / possibleCompletions) * 100)
      : 0;

  const possibleSubmissions = enrolledCount * totalAssignments;
  const assignmentSubmissionRate =
    possibleSubmissions > 0
      ? Math.round((submissionCount / possibleSubmissions) * 100)
      : 0;

  return {
    courseId,
    courseTitle,
    totalEnrolled: enrolledCount,
    lessonCompletionRate,
    averageQuizScore: Math.round(quizScoreAgg._avg.score ?? 0),
    assignmentSubmissionRate,
    activeStudents: Number(activeStudentResult[0]?.count ?? 0),
    forumPostCount,
  };
}

export async function getStudentEngagement(
  params: EngagementQueryParams & { tenantId?: string | null },
): Promise<StudentEngagementResponse> {
  const { courseId, search, sortBy, sortOrder, page, limit, tenantId } = params;
  const offset = (page - 1) * limit;

  const enrollmentWhere = {
    status: "APPROVED" as const,
    ...(courseId ? { courseId } : {}),
    ...(tenantId ? { course: { tenantId } } : {}),
    ...(search
      ? { fullName: { contains: search, mode: "insensitive" as const } }
      : {}),
  };

  const enrollments = await prisma.enrollment.findMany({
    where: enrollmentWhere,
    include: {
      course: {
        include: {
          lessons: { where: { isPublished: true }, select: { id: true } },
          assignments: { select: { id: true } },
        },
      },
      student: { select: { id: true } },
    },
  });

  const studentRows = await Promise.all(
    enrollments.map((enrollment) => buildStudentRow(enrollment))
  );

  const validRows = studentRows.filter(
    (row): row is StudentEngagementRow => row !== null
  );

  const sorted = [...validRows].sort((a, b) => {
    const fieldA = a[sortBy];
    const fieldB = b[sortBy];

    if (fieldA === null && fieldB === null) return 0;
    if (fieldA === null) return 1;
    if (fieldB === null) return -1;

    let comparison = 0;
    if (typeof fieldA === "string" && typeof fieldB === "string") {
      comparison = fieldA.localeCompare(fieldB);
    } else if (fieldA instanceof Date && fieldB instanceof Date) {
      comparison = fieldA.getTime() - fieldB.getTime();
    } else {
      comparison = (fieldA as number) - (fieldB as number);
    }

    return sortOrder === "desc" ? -comparison : comparison;
  });

  const paginated = sorted.slice(offset, offset + limit);

  return {
    students: paginated,
    total: validRows.length,
    page,
    limit,
  };
}

type EnrollmentWithRelations = {
  id: string;
  fullName: string;
  courseId: string;
  course: {
    title: string;
    lessons: ReadonlyArray<{ id: string }>;
    assignments: ReadonlyArray<{ id: string }>;
  };
  student: { id: string } | null;
};

async function buildStudentRow(
  enrollment: EnrollmentWithRelations
): Promise<StudentEngagementRow | null> {
  const student = enrollment.student;
  if (!student) return null;

  const [
    lessonsCompleted,
    quizAgg,
    submissionsCount,
    forumPostsCount,
    pointsAgg,
    lastActivities,
  ] = await Promise.all([
    prisma.lessonCompletion.count({
      where: {
        studentId: student.id,
        lesson: { courseId: enrollment.courseId },
      },
    }),

    prisma.quizAttempt.aggregate({
      where: {
        studentId: student.id,
        quiz: { courseId: enrollment.courseId },
      },
      _avg: { score: true },
    }),

    prisma.submission.count({
      where: {
        studentId: student.id,
        assignment: { courseId: enrollment.courseId },
      },
    }),

    prisma.forumPost.count({
      where: {
        studentId: student.id,
        thread: { courseId: enrollment.courseId },
      },
    }),

    prisma.pointTransaction.aggregate({
      where: { studentId: student.id },
      _sum: { points: true },
    }),

    prisma.$queryRaw<ReadonlyArray<{ last_active: Date | null }>>`
      SELECT GREATEST(
        (SELECT MAX("completedAt") FROM lesson_completions
         WHERE "studentId" = ${student.id}),
        (SELECT MAX("completedAt") FROM quiz_attempts
         WHERE "studentId" = ${student.id}),
        (SELECT MAX("submittedAt") FROM submissions
         WHERE "studentId" = ${student.id}),
        (SELECT MAX("createdAt") FROM forum_posts
         WHERE "studentId" = ${student.id})
      ) as last_active
    `,
  ]);

  const lastActiveAt = lastActivities[0]?.last_active ?? null;

  return {
    studentId: student.id,
    studentName: enrollment.fullName,
    courseId: enrollment.courseId,
    courseTitle: enrollment.course.title,
    lessonsCompleted,
    totalLessons: enrollment.course.lessons.length,
    quizAvgScore:
      quizAgg._avg.score !== null ? Math.round(quizAgg._avg.score) : null,
    assignmentsSubmitted: submissionsCount,
    totalAssignments: enrollment.course.assignments.length,
    forumPosts: forumPostsCount,
    lastActiveAt,
    totalPoints: pointsAgg._sum.points ?? 0,
    engagementStatus: computeEngagementStatus(lastActiveAt),
  };
}
