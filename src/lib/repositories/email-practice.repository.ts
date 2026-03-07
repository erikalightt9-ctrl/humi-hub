import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface EmailPracticeSessionRecord {
  readonly id: string;
  readonly studentId: string;
  readonly courseSlug: string;
  readonly scenarioType: string;
  readonly scenarioPrompt: string;
  readonly senderRole: string;
  readonly recipientRole: string;
  readonly studentEmail: string | null;
  readonly toneScore: number | null;
  readonly clarityScore: number | null;
  readonly completenessScore: number | null;
  readonly grammarScore: number | null;
  readonly industryLanguageScore: number | null;
  readonly overallScore: number | null;
  readonly aiFeedback: string | null;
  readonly suggestedVersion: string | null;
  readonly strengths: ReadonlyArray<string> | null;
  readonly improvements: ReadonlyArray<string> | null;
  readonly status: string;
  readonly createdAt: Date;
  readonly evaluatedAt: Date | null;
}

interface CreateSessionData {
  readonly studentId: string;
  readonly courseSlug: string;
  readonly scenarioType: string;
  readonly scenarioPrompt: string;
  readonly senderRole: string;
  readonly recipientRole: string;
}

interface EvaluationData {
  readonly toneScore: number;
  readonly clarityScore: number;
  readonly completenessScore: number;
  readonly grammarScore: number;
  readonly industryLanguageScore: number;
  readonly overallScore: number;
  readonly aiFeedback: string;
  readonly suggestedVersion: string;
  readonly strengths: ReadonlyArray<string>;
  readonly improvements: ReadonlyArray<string>;
}

/* ------------------------------------------------------------------ */
/*  Create                                                             */
/* ------------------------------------------------------------------ */

export async function createSession(
  data: CreateSessionData,
): Promise<EmailPracticeSessionRecord> {
  const session = await prisma.emailPracticeSession.create({
    data: {
      studentId: data.studentId,
      courseSlug: data.courseSlug,
      scenarioType: data.scenarioType,
      scenarioPrompt: data.scenarioPrompt,
      senderRole: data.senderRole,
      recipientRole: data.recipientRole,
      status: "pending",
    },
  });

  return formatSession(session);
}

/* ------------------------------------------------------------------ */
/*  Read                                                               */
/* ------------------------------------------------------------------ */

export async function getSession(
  sessionId: string,
): Promise<EmailPracticeSessionRecord | null> {
  const session = await prisma.emailPracticeSession.findUnique({
    where: { id: sessionId },
  });

  return session ? formatSession(session) : null;
}

export async function getStudentSessions(
  studentId: string,
): Promise<ReadonlyArray<EmailPracticeSessionRecord>> {
  const sessions = await prisma.emailPracticeSession.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return sessions.map(formatSession);
}

/* ------------------------------------------------------------------ */
/*  Update -- Save student email                                       */
/* ------------------------------------------------------------------ */

export async function updateWithEmail(
  sessionId: string,
  email: string,
): Promise<EmailPracticeSessionRecord> {
  const session = await prisma.emailPracticeSession.update({
    where: { id: sessionId },
    data: { studentEmail: email },
  });

  return formatSession(session);
}

/* ------------------------------------------------------------------ */
/*  Update -- Save evaluation results                                  */
/* ------------------------------------------------------------------ */

export async function updateWithEvaluation(
  sessionId: string,
  evaluation: EvaluationData,
): Promise<EmailPracticeSessionRecord> {
  const session = await prisma.emailPracticeSession.update({
    where: { id: sessionId },
    data: {
      toneScore: evaluation.toneScore,
      clarityScore: evaluation.clarityScore,
      completenessScore: evaluation.completenessScore,
      grammarScore: evaluation.grammarScore,
      industryLanguageScore: evaluation.industryLanguageScore,
      overallScore: evaluation.overallScore,
      aiFeedback: evaluation.aiFeedback,
      suggestedVersion: evaluation.suggestedVersion,
      strengths: JSON.parse(JSON.stringify(evaluation.strengths)),
      improvements: JSON.parse(JSON.stringify(evaluation.improvements)),
      status: "evaluated",
      evaluatedAt: new Date(),
    },
  });

  return formatSession(session);
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatSession(session: {
  id: string;
  studentId: string;
  courseSlug: string;
  scenarioType: string;
  scenarioPrompt: string;
  senderRole: string;
  recipientRole: string;
  studentEmail: string | null;
  toneScore: number | null;
  clarityScore: number | null;
  completenessScore: number | null;
  grammarScore: number | null;
  industryLanguageScore: number | null;
  overallScore: number | null;
  aiFeedback: string | null;
  suggestedVersion: string | null;
  strengths: unknown;
  improvements: unknown;
  status: string;
  createdAt: Date;
  evaluatedAt: Date | null;
}): EmailPracticeSessionRecord {
  return {
    id: session.id,
    studentId: session.studentId,
    courseSlug: session.courseSlug,
    scenarioType: session.scenarioType,
    scenarioPrompt: session.scenarioPrompt,
    senderRole: session.senderRole,
    recipientRole: session.recipientRole,
    studentEmail: session.studentEmail,
    toneScore: session.toneScore,
    clarityScore: session.clarityScore,
    completenessScore: session.completenessScore,
    grammarScore: session.grammarScore,
    industryLanguageScore: session.industryLanguageScore,
    overallScore: session.overallScore,
    aiFeedback: session.aiFeedback,
    suggestedVersion: session.suggestedVersion,
    strengths:
      (session.strengths as unknown as ReadonlyArray<string>) ?? null,
    improvements:
      (session.improvements as unknown as ReadonlyArray<string>) ?? null,
    status: session.status,
    createdAt: session.createdAt,
    evaluatedAt: session.evaluatedAt,
  };
}
