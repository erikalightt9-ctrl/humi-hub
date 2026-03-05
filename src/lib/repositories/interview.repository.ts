import { prisma } from "@/lib/prisma";
import type {
  InterviewQuestion,
  InterviewSessionRecord,
} from "@/lib/types/ai.types";

/* ------------------------------------------------------------------ */
/*  Create                                                             */
/* ------------------------------------------------------------------ */

export async function createSession(
  studentId: string,
  role: string,
  courseSlug: string,
  firstQuestion: InterviewQuestion,
): Promise<InterviewSessionRecord> {
  const session = await prisma.interviewSession.create({
    data: {
      studentId,
      role,
      courseSlug,
      questions: JSON.parse(JSON.stringify([firstQuestion])),
      status: "active",
    },
  });

  return formatSession(session);
}

/* ------------------------------------------------------------------ */
/*  Read                                                               */
/* ------------------------------------------------------------------ */

export async function getSession(
  sessionId: string,
): Promise<InterviewSessionRecord | null> {
  const session = await prisma.interviewSession.findUnique({
    where: { id: sessionId },
  });

  return session ? formatSession(session) : null;
}

export async function getStudentSessions(
  studentId: string,
): Promise<ReadonlyArray<InterviewSessionRecord>> {
  const sessions = await prisma.interviewSession.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return sessions.map(formatSession);
}

/* ------------------------------------------------------------------ */
/*  Update — Add question                                              */
/* ------------------------------------------------------------------ */

export async function addQuestion(
  sessionId: string,
  question: InterviewQuestion,
): Promise<InterviewSessionRecord> {
  const existing = await prisma.interviewSession.findUnique({
    where: { id: sessionId },
    select: { questions: true },
  });

  const currentQuestions =
    (existing?.questions as unknown as InterviewQuestion[]) ?? [];
  const updatedQuestions = [...currentQuestions, question];

  const session = await prisma.interviewSession.update({
    where: { id: sessionId },
    data: {
      questions: JSON.parse(JSON.stringify(updatedQuestions)),
    },
  });

  return formatSession(session);
}

/* ------------------------------------------------------------------ */
/*  Update — Update last question (answer + follow-up + score)         */
/* ------------------------------------------------------------------ */

export async function updateLastQuestion(
  sessionId: string,
  updatedQuestion: InterviewQuestion,
): Promise<InterviewSessionRecord> {
  const existing = await prisma.interviewSession.findUnique({
    where: { id: sessionId },
    select: { questions: true },
  });

  const currentQuestions =
    (existing?.questions as unknown as InterviewQuestion[]) ?? [];

  const updatedQuestions = [
    ...currentQuestions.slice(0, -1),
    updatedQuestion,
  ];

  const session = await prisma.interviewSession.update({
    where: { id: sessionId },
    data: {
      questions: JSON.parse(JSON.stringify(updatedQuestions)),
    },
  });

  return formatSession(session);
}

/* ------------------------------------------------------------------ */
/*  Update — Complete session                                          */
/* ------------------------------------------------------------------ */

export async function completeSession(
  sessionId: string,
  scores: {
    readonly overallScore: number;
    readonly communicationScore: number;
    readonly knowledgeScore: number;
    readonly problemSolvingScore: number;
    readonly professionalismScore: number;
    readonly aiFeedback: string;
  },
): Promise<InterviewSessionRecord> {
  const session = await prisma.interviewSession.update({
    where: { id: sessionId },
    data: {
      status: "completed",
      completedAt: new Date(),
      ...scores,
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
  role: string;
  courseSlug: string;
  questions: unknown;
  status: string;
  overallScore: number | null;
  communicationScore: number | null;
  knowledgeScore: number | null;
  problemSolvingScore: number | null;
  professionalismScore: number | null;
  aiFeedback: string | null;
  createdAt: Date;
  completedAt: Date | null;
}): InterviewSessionRecord {
  return {
    id: session.id,
    studentId: session.studentId,
    role: session.role,
    courseSlug: session.courseSlug,
    questions:
      (session.questions as unknown as InterviewQuestion[]) ?? [],
    status: session.status,
    overallScore: session.overallScore,
    communicationScore: session.communicationScore,
    knowledgeScore: session.knowledgeScore,
    problemSolvingScore: session.problemSolvingScore,
    professionalismScore: session.professionalismScore,
    aiFeedback: session.aiFeedback,
    createdAt: session.createdAt,
    completedAt: session.completedAt,
  };
}
