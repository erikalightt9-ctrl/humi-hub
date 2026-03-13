import { prisma } from "@/lib/prisma";
import type { CourseSlug } from "@/types";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface GraduateCareerScore {
  readonly overallScore: number;
  readonly communication: number;
  readonly accuracy: number;
  readonly speed: number;
  readonly reliability: number;
  readonly technicalSkills: number;
  readonly professionalism: number;
}

export interface GraduateEntry {
  readonly id: string;
  readonly name: string;
  readonly bio: string | null;
  readonly avatarUrl: string | null;
  readonly courseSlug: string;
  readonly courseTitle: string;
  readonly latestScore: GraduateCareerScore;
  readonly certificateCount: number;
  readonly badgeCount: number;
}

/* ------------------------------------------------------------------ */
/*  Course slug mapping                                                */
/* ------------------------------------------------------------------ */

const COURSE_SLUG_MAP: Readonly<Record<string, CourseSlug>> = {
  "medical-va": "MEDICAL_VA",
  "real-estate-va": "REAL_ESTATE_VA",
  "us-bookkeeping-va": "US_BOOKKEEPING_VA",
} as const;

function toPrismaCourseSlug(slug: string): CourseSlug | null {
  return COURSE_SLUG_MAP[slug] ?? null;
}

/* ------------------------------------------------------------------ */
/*  Query: Top graduates for employer dashboard                        */
/* ------------------------------------------------------------------ */

export async function getTopGraduates(
  courseSlug?: string,
): Promise<ReadonlyArray<GraduateEntry>> {
  const courseFilter = courseSlug ? toPrismaCourseSlug(courseSlug) : null;

  const students = await prisma.student.findMany({
    where: {
      portfolioPublic: true,
      careerScores: { some: {} },
      ...(courseFilter
        ? { enrollment: { course: { slug: courseFilter } } }
        : {}),
    },
    select: {
      id: true,
      name: true,
      bio: true,
      avatarUrl: true,
      enrollment: {
        select: {
          course: {
            select: {
              slug: true,
              title: true,
            },
          },
        },
      },
      careerScores: {
        orderBy: { evaluatedAt: "desc" },
        take: 1,
        select: {
          overallScore: true,
          communication: true,
          accuracy: true,
          speed: true,
          reliability: true,
          technicalSkills: true,
          professionalism: true,
        },
      },
      _count: {
        select: {
          certificates: true,
          badges: true,
        },
      },
    },
  });

  /* Map, sort by overallScore desc, and limit to 30 */
  const graduates: ReadonlyArray<GraduateEntry> = students
    .filter((s) => s.careerScores.length > 0)
    .map((s) => ({
      id: s.id,
      name: s.name,
      bio: s.bio,
      avatarUrl: s.avatarUrl,
      courseSlug: s.enrollment.course.slug,
      courseTitle: s.enrollment.course.title,
      latestScore: {
        overallScore: s.careerScores[0].overallScore,
        communication: s.careerScores[0].communication,
        accuracy: s.careerScores[0].accuracy,
        speed: s.careerScores[0].speed,
        reliability: s.careerScores[0].reliability,
        technicalSkills: s.careerScores[0].technicalSkills,
        professionalism: s.careerScores[0].professionalism,
      },
      certificateCount: s._count.certificates,
      badgeCount: s._count.badges,
    }))
    .sort((a, b) => b.latestScore.overallScore - a.latestScore.overallScore)
    .slice(0, 30);

  return graduates;
}
