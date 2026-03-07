import { prisma } from "@/lib/prisma";
import type { CourseSlug } from "@prisma/client";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface DimensionBreakdown {
  readonly careerReadiness: number;
  readonly quizAverage: number;
  readonly assignmentAverage: number;
  readonly badgesNormalized: number;
  readonly courseProgress: number;
  readonly forumParticipation: number;
}

export interface PublicRankedStudent {
  readonly rank: number;
  readonly anonymizedName: string;
  readonly courseTitle: string;
  readonly courseSlug: string;
  readonly compositeScore: number;
}

export interface AdminRankedStudent {
  readonly rank: number;
  readonly studentId: string;
  readonly name: string;
  readonly email: string;
  readonly courseTitle: string;
  readonly courseSlug: string;
  readonly compositeScore: number;
  readonly dimensions: DimensionBreakdown;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const WEIGHTS = {
  careerReadiness: 0.3,
  quizAverage: 0.2,
  assignmentAverage: 0.2,
  badgesNormalized: 0.1,
  courseProgress: 0.1,
  forumParticipation: 0.1,
} as const;

const TOTAL_BADGE_TYPES = 6;
const MAX_FORUM_SCORE = 100;
const FORUM_POINTS_PER_POST = 5;

const COURSE_SLUG_MAP: Readonly<Record<string, CourseSlug>> = {
  "medical-va": "MEDICAL_VA",
  "real-estate-va": "REAL_ESTATE_VA",
  "us-bookkeeping-va": "US_BOOKKEEPING_VA",
} as const;

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                   */
/* ------------------------------------------------------------------ */

function toPrismaCourseSlug(slug: string): CourseSlug | null {
  return COURSE_SLUG_MAP[slug] ?? null;
}

function anonymizeName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return "Unknown";
  const firstName = parts[0];
  const lastInitial = parts.length > 1 ? ` ${parts[parts.length - 1][0]}.` : "";
  return `${firstName}${lastInitial}`;
}

function computeComposite(dims: DimensionBreakdown): number {
  const raw =
    dims.careerReadiness * WEIGHTS.careerReadiness +
    dims.quizAverage * WEIGHTS.quizAverage +
    dims.assignmentAverage * WEIGHTS.assignmentAverage +
    dims.badgesNormalized * WEIGHTS.badgesNormalized +
    dims.courseProgress * WEIGHTS.courseProgress +
    dims.forumParticipation * WEIGHTS.forumParticipation;

  return Math.round(raw * 10) / 10;
}

/* ------------------------------------------------------------------ */
/*  Raw student data fetcher                                           */
/* ------------------------------------------------------------------ */

interface RawStudentData {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly courseTitle: string;
  readonly courseSlug: string;
  readonly courseId: string;
}

async function fetchStudentsWithCourse(
  courseSlug?: string,
): Promise<ReadonlyArray<RawStudentData>> {
  const courseFilter = courseSlug ? toPrismaCourseSlug(courseSlug) : null;

  const students = await prisma.student.findMany({
    where: {
      accessGranted: true,
      ...(courseFilter
        ? { enrollment: { course: { slug: courseFilter } } }
        : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
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

  return students.map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    courseTitle: s.enrollment.course.title,
    courseSlug: s.enrollment.course.slug,
    courseId: s.enrollment.courseId,
  }));
}

/* ------------------------------------------------------------------ */
/*  Dimension calculator for a single student                          */
/* ------------------------------------------------------------------ */

async function computeDimensions(
  studentId: string,
  courseId: string,
): Promise<DimensionBreakdown> {
  const [
    latestCareerScore,
    quizAgg,
    assignmentAgg,
    badgeCount,
    lessonCompletionCount,
    totalLessonCount,
    forumPostCount,
  ] = await Promise.all([
    prisma.careerReadinessScore.findFirst({
      where: { studentId },
      orderBy: { evaluatedAt: "desc" },
      select: { overallScore: true },
    }),

    prisma.quizAttempt.aggregate({
      where: { studentId, quiz: { courseId } },
      _avg: { score: true },
    }),

    prisma.submission.aggregate({
      where: {
        studentId,
        assignment: { courseId },
        grade: { not: null },
      },
      _avg: { grade: true },
    }),

    prisma.studentBadge.count({
      where: { studentId },
    }),

    prisma.lessonCompletion.count({
      where: { studentId, lesson: { courseId, isPublished: true } },
    }),

    prisma.lesson.count({
      where: { courseId, isPublished: true },
    }),

    prisma.forumPost.count({
      where: { studentId },
    }),
  ]);

  const careerReadiness = latestCareerScore?.overallScore ?? 0;
  const quizAverage = Math.round(quizAgg._avg.score ?? 0);
  const assignmentAverage = Math.round(assignmentAgg._avg.grade ?? 0);
  const badgesNormalized = Math.min(
    Math.round((badgeCount / TOTAL_BADGE_TYPES) * 100),
    100,
  );
  const courseProgress =
    totalLessonCount > 0
      ? Math.round((lessonCompletionCount / totalLessonCount) * 100)
      : 0;
  const forumParticipation = Math.min(
    forumPostCount * FORUM_POINTS_PER_POST,
    MAX_FORUM_SCORE,
  );

  return {
    careerReadiness,
    quizAverage,
    assignmentAverage,
    badgesNormalized,
    courseProgress,
    forumParticipation,
  };
}

/* ------------------------------------------------------------------ */
/*  Public ranking: anonymized top 20                                  */
/* ------------------------------------------------------------------ */

export async function getPublicRanking(
  courseSlug?: string,
): Promise<ReadonlyArray<PublicRankedStudent>> {
  const students = await fetchStudentsWithCourse(courseSlug);

  const scored = await Promise.all(
    students.map(async (s) => {
      const dims = await computeDimensions(s.id, s.courseId);
      const compositeScore = computeComposite(dims);
      return {
        anonymizedName: anonymizeName(s.name),
        courseTitle: s.courseTitle,
        courseSlug: s.courseSlug,
        compositeScore,
      };
    }),
  );

  const sorted = [...scored].sort(
    (a, b) => b.compositeScore - a.compositeScore,
  );

  return sorted.slice(0, 20).map((s, idx) => ({
    rank: idx + 1,
    anonymizedName: s.anonymizedName,
    courseTitle: s.courseTitle,
    courseSlug: s.courseSlug,
    compositeScore: s.compositeScore,
  }));
}

/* ------------------------------------------------------------------ */
/*  Admin ranking: full details, all students                          */
/* ------------------------------------------------------------------ */

export async function getAdminRanking(
  courseSlug?: string,
): Promise<ReadonlyArray<AdminRankedStudent>> {
  const students = await fetchStudentsWithCourse(courseSlug);

  const scored = await Promise.all(
    students.map(async (s) => {
      const dims = await computeDimensions(s.id, s.courseId);
      const compositeScore = computeComposite(dims);
      return {
        studentId: s.id,
        name: s.name,
        email: s.email,
        courseTitle: s.courseTitle,
        courseSlug: s.courseSlug,
        compositeScore,
        dimensions: dims,
      };
    }),
  );

  const sorted = [...scored].sort(
    (a, b) => b.compositeScore - a.compositeScore,
  );

  return sorted.map((s, idx) => ({
    rank: idx + 1,
    studentId: s.studentId,
    name: s.name,
    email: s.email,
    courseTitle: s.courseTitle,
    courseSlug: s.courseSlug,
    compositeScore: s.compositeScore,
    dimensions: s.dimensions,
  }));
}
