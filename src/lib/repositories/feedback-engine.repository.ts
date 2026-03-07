import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type TrendDirection =
  | "improving"
  | "declining"
  | "stable"
  | "insufficient_data";

interface FeatureSummary {
  readonly featureName: string;
  readonly featureSlug: string;
  readonly latestScore: number | null;
  readonly averageScore: number | null;
  readonly sessionCount: number;
  readonly lastActivityAt: string | null;
  readonly trend: TrendDirection;
}

interface RecentScore {
  readonly date: string;
  readonly score: number;
  readonly feature: string;
}

export interface AggregatedFeedback {
  readonly overallAverageScore: number | null;
  readonly totalAISessions: number;
  readonly features: ReadonlyArray<FeatureSummary>;
  readonly recentScores: ReadonlyArray<RecentScore>;
}

interface SessionDetail {
  readonly score: number;
  readonly feedback: string | null;
  readonly date: string;
}

interface FeatureDetail {
  readonly featureName: string;
  readonly sessions: ReadonlyArray<SessionDetail>;
  readonly scores: ReadonlyArray<number>;
}

export interface DetailedAssessmentData {
  readonly features: ReadonlyArray<FeatureDetail>;
  readonly hasData: boolean;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function computeTrend(scores: ReadonlyArray<number>): TrendDirection {
  if (scores.length < 3) return "insufficient_data";

  // scores are ordered newest-first; reverse for chronological
  const chronological = [...scores].reverse();

  const last3 = chronological.slice(-3);
  const prev3 = chronological.slice(-6, -3);

  if (prev3.length === 0) return "insufficient_data";

  const last3Avg = last3.reduce((a, b) => a + b, 0) / last3.length;
  const prev3Avg = prev3.reduce((a, b) => a + b, 0) / prev3.length;

  if (last3Avg > prev3Avg + 5) return "improving";
  if (last3Avg < prev3Avg - 5) return "declining";
  return "stable";
}

function truncate(text: string | null, maxLen: number): string | null {
  if (!text) return null;
  return text.length > maxLen ? text.slice(0, maxLen) + "..." : text;
}

/* ------------------------------------------------------------------ */
/*  getAggregatedFeedback                                              */
/* ------------------------------------------------------------------ */

export async function getAggregatedFeedback(
  studentId: string,
): Promise<AggregatedFeedback> {
  const [
    submissions,
    simulations,
    interviews,
    emailSessions,
    careerScores,
  ] = await Promise.all([
    prisma.submission.findMany({
      where: { studentId, aiEvaluation: { not: Prisma.JsonNull } },
      orderBy: { submittedAt: "desc" },
      select: { aiEvaluation: true, submittedAt: true },
    }),

    prisma.simulationSession.findMany({
      where: { studentId, status: "completed", overallScore: { not: null } },
      orderBy: { completedAt: "desc" },
      select: { overallScore: true, completedAt: true },
    }),

    prisma.interviewSession.findMany({
      where: { studentId, status: "completed", overallScore: { not: null } },
      orderBy: { completedAt: "desc" },
      select: { overallScore: true, completedAt: true },
    }),

    prisma.emailPracticeSession.findMany({
      where: { studentId, status: "evaluated", overallScore: { not: null } },
      orderBy: { evaluatedAt: "desc" },
      select: { overallScore: true, evaluatedAt: true },
    }),

    prisma.careerReadinessScore.findMany({
      where: { studentId },
      orderBy: { evaluatedAt: "desc" },
      select: { overallScore: true, evaluatedAt: true },
    }),
  ]);

  /* ----- Submission scores ----- */
  const submissionScores = submissions
    .map((s) => (s.aiEvaluation as unknown as { score?: number })?.score)
    .filter((s): s is number => typeof s === "number");

  const submissionDates = submissions.map((s) => s.submittedAt);

  /* ----- Simulation scores ----- */
  const simulationScores = simulations
    .map((s) => s.overallScore)
    .filter((s): s is number => s !== null);

  const simulationDates = simulations.map((s) => s.completedAt!);

  /* ----- Interview scores ----- */
  const interviewScores = interviews
    .map((s) => s.overallScore)
    .filter((s): s is number => s !== null);

  const interviewDates = interviews.map((s) => s.completedAt!);

  /* ----- Email scores ----- */
  const emailScores = emailSessions
    .map((s) => s.overallScore)
    .filter((s): s is number => s !== null);

  const emailDates = emailSessions.map((s) => s.evaluatedAt!);

  /* ----- Career scores ----- */
  const careerScoresArr = careerScores.map((s) => s.overallScore);
  const careerDates = careerScores.map((s) => s.evaluatedAt);

  /* ----- Build feature summaries ----- */
  const featureDataSets: ReadonlyArray<{
    readonly name: string;
    readonly slug: string;
    readonly scores: ReadonlyArray<number>;
    readonly dates: ReadonlyArray<Date>;
  }> = [
    {
      name: "Assignments",
      slug: "assignments",
      scores: submissionScores,
      dates: submissionDates,
    },
    {
      name: "VA Simulations",
      slug: "va-simulations",
      scores: simulationScores,
      dates: simulationDates,
    },
    {
      name: "Mock Interviews",
      slug: "mock-interviews",
      scores: interviewScores,
      dates: interviewDates,
    },
    {
      name: "Email Practice",
      slug: "email-practice",
      scores: emailScores,
      dates: emailDates,
    },
    {
      name: "Career Readiness",
      slug: "career-readiness",
      scores: careerScoresArr,
      dates: careerDates,
    },
  ];

  const features: ReadonlyArray<FeatureSummary> = featureDataSets.map(
    ({ name, slug, scores, dates }) => {
      const count = scores.length;

      if (count === 0) {
        return {
          featureName: name,
          featureSlug: slug,
          latestScore: null,
          averageScore: null,
          sessionCount: 0,
          lastActivityAt: null,
          trend: "insufficient_data" as const,
        };
      }

      const avg = Math.round(
        scores.reduce((a, b) => a + b, 0) / count,
      );

      return {
        featureName: name,
        featureSlug: slug,
        latestScore: scores[0] ?? null,
        averageScore: avg,
        sessionCount: count,
        lastActivityAt: dates[0]?.toISOString() ?? null,
        trend: computeTrend(scores),
      };
    },
  );

  /* ----- Overall average (weighted by session count) ----- */
  const featuresWithData = features.filter((f) => f.averageScore !== null);
  const totalSessions = features.reduce((a, f) => a + f.sessionCount, 0);

  let overallAverageScore: number | null = null;
  if (featuresWithData.length > 0) {
    const weightedSum = featuresWithData.reduce(
      (sum, f) => sum + f.averageScore! * f.sessionCount,
      0,
    );
    overallAverageScore = Math.round(weightedSum / totalSessions);
  }

  /* ----- Recent scores (last 20 across all features) ----- */
  const allRecent: Array<{
    readonly date: Date;
    readonly score: number;
    readonly feature: string;
  }> = [];

  featureDataSets.forEach(({ name, scores, dates }) => {
    scores.forEach((score, i) => {
      const date = dates[i];
      if (date) {
        allRecent.push({ date, score, feature: name });
      }
    });
  });

  allRecent.sort((a, b) => b.date.getTime() - a.date.getTime());

  const recentScores: ReadonlyArray<RecentScore> = allRecent
    .slice(0, 20)
    .map(({ date, score, feature }) => ({
      date: date.toISOString(),
      score,
      feature,
    }));

  return {
    overallAverageScore,
    totalAISessions: totalSessions,
    features,
    recentScores,
  };
}

/* ------------------------------------------------------------------ */
/*  getDetailedDataForAssessment                                       */
/* ------------------------------------------------------------------ */

export async function getDetailedDataForAssessment(
  studentId: string,
): Promise<DetailedAssessmentData> {
  const [
    submissions,
    simulations,
    interviews,
    emailSessions,
    careerScores,
  ] = await Promise.all([
    prisma.submission.findMany({
      where: { studentId, aiEvaluation: { not: Prisma.JsonNull } },
      orderBy: { submittedAt: "desc" },
      take: 5,
      select: { aiEvaluation: true, submittedAt: true },
    }),

    prisma.simulationSession.findMany({
      where: { studentId, status: "completed", overallScore: { not: null } },
      orderBy: { completedAt: "desc" },
      take: 5,
      select: {
        overallScore: true,
        communicationScore: true,
        problemSolvingScore: true,
        professionalismScore: true,
        aiFeedback: true,
        completedAt: true,
      },
    }),

    prisma.interviewSession.findMany({
      where: { studentId, status: "completed", overallScore: { not: null } },
      orderBy: { completedAt: "desc" },
      take: 5,
      select: {
        overallScore: true,
        communicationScore: true,
        knowledgeScore: true,
        problemSolvingScore: true,
        professionalismScore: true,
        aiFeedback: true,
        completedAt: true,
      },
    }),

    prisma.emailPracticeSession.findMany({
      where: { studentId, status: "evaluated", overallScore: { not: null } },
      orderBy: { evaluatedAt: "desc" },
      take: 5,
      select: {
        overallScore: true,
        toneScore: true,
        clarityScore: true,
        completenessScore: true,
        grammarScore: true,
        industryLanguageScore: true,
        aiFeedback: true,
        evaluatedAt: true,
      },
    }),

    prisma.careerReadinessScore.findMany({
      where: { studentId },
      orderBy: { evaluatedAt: "desc" },
      take: 5,
      select: {
        overallScore: true,
        communication: true,
        accuracy: true,
        speed: true,
        reliability: true,
        technicalSkills: true,
        professionalism: true,
        aiSummary: true,
        evaluatedAt: true,
      },
    }),
  ]);

  const features: ReadonlyArray<FeatureDetail> = [
    {
      featureName: "Assignments",
      sessions: submissions.map((s) => {
        const evaluation = s.aiEvaluation as unknown as {
          score?: number;
          feedback?: string;
        };
        return {
          score: evaluation?.score ?? 0,
          feedback: truncate(evaluation?.feedback ?? null, 200),
          date: s.submittedAt.toISOString(),
        };
      }),
      scores: submissions
        .map(
          (s) =>
            (s.aiEvaluation as unknown as { score?: number })?.score,
        )
        .filter((s): s is number => typeof s === "number"),
    },

    {
      featureName: "VA Simulations",
      sessions: simulations.map((s) => ({
        score: s.overallScore ?? 0,
        feedback: truncate(s.aiFeedback, 200),
        date: s.completedAt!.toISOString(),
      })),
      scores: simulations
        .map((s) => s.overallScore)
        .filter((s): s is number => s !== null),
    },

    {
      featureName: "Mock Interviews",
      sessions: interviews.map((s) => ({
        score: s.overallScore ?? 0,
        feedback: truncate(s.aiFeedback, 200),
        date: s.completedAt!.toISOString(),
      })),
      scores: interviews
        .map((s) => s.overallScore)
        .filter((s): s is number => s !== null),
    },

    {
      featureName: "Email Practice",
      sessions: emailSessions.map((s) => ({
        score: s.overallScore ?? 0,
        feedback: truncate(s.aiFeedback, 200),
        date: s.evaluatedAt!.toISOString(),
      })),
      scores: emailSessions
        .map((s) => s.overallScore)
        .filter((s): s is number => s !== null),
    },

    {
      featureName: "Career Readiness",
      sessions: careerScores.map((s) => ({
        score: s.overallScore,
        feedback: truncate(s.aiSummary, 200),
        date: s.evaluatedAt.toISOString(),
      })),
      scores: careerScores.map((s) => s.overallScore),
    },
  ];

  const hasData = features.some((f) => f.sessions.length > 0);

  return { features, hasData };
}
