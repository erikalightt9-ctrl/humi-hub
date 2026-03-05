import { prisma } from "@/lib/prisma";
import type {
  CareerReadinessScoreRecord,
  StudentMetricsForScoring,
} from "@/lib/types/ai.types";

/* ------------------------------------------------------------------ */
/*  Read                                                               */
/* ------------------------------------------------------------------ */

export async function getLatestScore(
  studentId: string,
): Promise<CareerReadinessScoreRecord | null> {
  const score = await prisma.careerReadinessScore.findFirst({
    where: { studentId },
    orderBy: { evaluatedAt: "desc" },
  });

  return score;
}

export async function getScoreHistory(
  studentId: string,
): Promise<ReadonlyArray<CareerReadinessScoreRecord>> {
  const scores = await prisma.careerReadinessScore.findMany({
    where: { studentId },
    orderBy: { evaluatedAt: "desc" },
    take: 10,
  });

  return scores;
}

/* ------------------------------------------------------------------ */
/*  Write                                                              */
/* ------------------------------------------------------------------ */

interface SaveScoreInput {
  readonly studentId: string;
  readonly communication: number;
  readonly accuracy: number;
  readonly speed: number;
  readonly reliability: number;
  readonly technicalSkills: number;
  readonly professionalism: number;
  readonly overallScore: number;
  readonly aiSummary: string;
}

export async function saveScore(
  input: SaveScoreInput,
): Promise<CareerReadinessScoreRecord> {
  const score = await prisma.careerReadinessScore.create({
    data: {
      studentId: input.studentId,
      communication: input.communication,
      accuracy: input.accuracy,
      speed: input.speed,
      reliability: input.reliability,
      technicalSkills: input.technicalSkills,
      professionalism: input.professionalism,
      overallScore: input.overallScore,
      aiSummary: input.aiSummary,
    },
  });

  return score;
}

/* ------------------------------------------------------------------ */
/*  Student data aggregation for AI scoring                            */
/* ------------------------------------------------------------------ */

export async function getStudentDataForScoring(
  studentId: string,
): Promise<StudentMetricsForScoring | null> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      name: true,
      createdAt: true,
      enrollment: {
        select: {
          courseId: true,
          course: {
            select: {
              title: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  if (!student) return null;

  const courseId = student.enrollment.courseId;

  const [
    quizAgg,
    assignmentAgg,
    lessonsCompleted,
    totalLessons,
    attendanceDays,
    forumPosts,
    badgesEarned,
    pointsAgg,
  ] = await Promise.all([
    prisma.quizAttempt.aggregate({
      where: { studentId, quiz: { courseId } },
      _avg: { score: true },
    }),

    prisma.submission.aggregate({
      where: { studentId, assignment: { courseId }, status: "GRADED" },
      _avg: { grade: true },
    }),

    prisma.lessonCompletion.count({
      where: { studentId, lesson: { courseId, isPublished: true } },
    }),

    prisma.lesson.count({
      where: { courseId, isPublished: true },
    }),

    prisma.attendanceRecord.count({
      where: { studentId },
    }),

    prisma.forumPost.count({
      where: { studentId, thread: { courseId } },
    }),

    prisma.studentBadge.count({
      where: { studentId },
    }),

    prisma.pointTransaction.aggregate({
      where: { studentId },
      _sum: { points: true },
    }),
  ]);

  const daysSinceEnrollment = Math.floor(
    (Date.now() - student.createdAt.getTime()) / (1000 * 60 * 60 * 24),
  );

  return {
    studentName: student.name,
    courseTitle: student.enrollment.course.title,
    courseSlug: student.enrollment.course.slug,
    quizAverage: Math.round(quizAgg._avg.score ?? 0),
    assignmentAverage: Math.round(assignmentAgg._avg.grade ?? 0),
    lessonsCompleted,
    totalLessons,
    attendanceDays,
    forumPosts,
    badgesEarned,
    totalPoints: pointsAgg._sum.points ?? 0,
    daysSinceEnrollment,
  };
}
