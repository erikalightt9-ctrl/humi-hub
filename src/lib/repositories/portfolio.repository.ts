import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface PortfolioCertificate {
  readonly certNumber: string;
  readonly courseTitle: string;
  readonly issuedAt: Date;
}

export interface PortfolioBadge {
  readonly name: string;
  readonly icon: string;
  readonly description: string;
  readonly earnedAt: Date;
}

export interface PortfolioQuizScore {
  readonly quizTitle: string;
  readonly bestScore: number;
  readonly passed: boolean;
}

export interface PortfolioAssignment {
  readonly title: string;
  readonly grade: number | null;
  readonly status: string;
}

export interface PortfolioData {
  readonly studentName: string;
  readonly isPublic: boolean;
  readonly courseTitle: string;
  readonly courseSlug: string;
  readonly enrolledAt: Date;
  readonly certificates: ReadonlyArray<PortfolioCertificate>;
  readonly badges: ReadonlyArray<PortfolioBadge>;
  readonly quizScores: ReadonlyArray<PortfolioQuizScore>;
  readonly assignments: ReadonlyArray<PortfolioAssignment>;
}

/* ------------------------------------------------------------------ */
/*  Get Portfolio Data                                                 */
/* ------------------------------------------------------------------ */

export async function getPortfolioData(
  studentId: string
): Promise<PortfolioData | null> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      name: true,
      portfolioPublic: true,
      createdAt: true,
      enrollment: {
        select: {
          course: { select: { title: true, slug: true } },
        },
      },
      certificates: {
        select: {
          certNumber: true,
          issuedAt: true,
          course: { select: { title: true } },
        },
        orderBy: { issuedAt: "desc" },
      },
      badges: {
        select: {
          earnedAt: true,
          badge: {
            select: { name: true, icon: true, description: true },
          },
        },
        orderBy: { earnedAt: "desc" },
      },
      attempts: {
        select: {
          score: true,
          passed: true,
          quiz: { select: { title: true } },
        },
        orderBy: { completedAt: "desc" },
      },
      submissions: {
        select: {
          grade: true,
          status: true,
          assignment: { select: { title: true } },
        },
        orderBy: { submittedAt: "desc" },
      },
    },
  });

  if (!student) return null;

  /* Deduplicate quiz attempts — keep best score per quiz */
  const quizBestScores = new Map<string, PortfolioQuizScore>();
  for (const attempt of student.attempts) {
    const existing = quizBestScores.get(attempt.quiz.title);
    if (!existing || attempt.score > existing.bestScore) {
      quizBestScores.set(attempt.quiz.title, {
        quizTitle: attempt.quiz.title,
        bestScore: attempt.score,
        passed: attempt.passed,
      });
    }
  }

  return {
    studentName: student.name,
    isPublic: student.portfolioPublic,
    courseTitle: student.enrollment.course.title,
    courseSlug: student.enrollment.course.slug,
    enrolledAt: student.createdAt,
    certificates: student.certificates.map((c) => ({
      certNumber: c.certNumber,
      courseTitle: c.course.title,
      issuedAt: c.issuedAt,
    })),
    badges: student.badges.map((b) => ({
      name: b.badge.name,
      icon: b.badge.icon,
      description: b.badge.description,
      earnedAt: b.earnedAt,
    })),
    quizScores: Array.from(quizBestScores.values()),
    assignments: student.submissions.map((s) => ({
      title: s.assignment.title,
      grade: s.grade,
      status: s.status,
    })),
  };
}

/* ------------------------------------------------------------------ */
/*  Toggle Visibility                                                  */
/* ------------------------------------------------------------------ */

export async function updatePortfolioVisibility(
  studentId: string,
  isPublic: boolean
): Promise<{ readonly portfolioPublic: boolean }> {
  return prisma.student.update({
    where: { id: studentId },
    data: { portfolioPublic: isPublic },
    select: { portfolioPublic: true },
  });
}
