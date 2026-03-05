import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface SimulationMessage {
  readonly role: "client" | "student";
  readonly content: string;
  readonly timestamp: string;
}

export interface SimulationRecord {
  readonly id: string;
  readonly studentId: string;
  readonly scenario: string;
  readonly courseSlug: string;
  readonly messages: ReadonlyArray<SimulationMessage>;
  readonly status: string;
  readonly communicationScore: number | null;
  readonly problemSolvingScore: number | null;
  readonly professionalismScore: number | null;
  readonly overallScore: number | null;
  readonly aiFeedback: string | null;
  readonly createdAt: Date;
  readonly completedAt: Date | null;
}

/* ------------------------------------------------------------------ */
/*  Create                                                             */
/* ------------------------------------------------------------------ */

export async function createSession(
  studentId: string,
  scenario: string,
  courseSlug: string,
  initialMessage: SimulationMessage,
): Promise<SimulationRecord> {
  const session = await prisma.simulationSession.create({
    data: {
      studentId,
      scenario,
      courseSlug,
      messages: JSON.parse(JSON.stringify([initialMessage])),
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
): Promise<SimulationRecord | null> {
  const session = await prisma.simulationSession.findUnique({
    where: { id: sessionId },
  });

  return session ? formatSession(session) : null;
}

export async function getStudentSessions(
  studentId: string,
): Promise<ReadonlyArray<SimulationRecord>> {
  const sessions = await prisma.simulationSession.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return sessions.map(formatSession);
}

/* ------------------------------------------------------------------ */
/*  Update                                                             */
/* ------------------------------------------------------------------ */

export async function addMessage(
  sessionId: string,
  message: SimulationMessage,
): Promise<SimulationRecord> {
  const existing = await prisma.simulationSession.findUnique({
    where: { id: sessionId },
    select: { messages: true },
  });

  const currentMessages = (existing?.messages as unknown as SimulationMessage[]) ?? [];
  const updatedMessages = [...currentMessages, message];

  const session = await prisma.simulationSession.update({
    where: { id: sessionId },
    data: {
      messages: JSON.parse(JSON.stringify(updatedMessages)),
    },
  });

  return formatSession(session);
}

export async function completeSession(
  sessionId: string,
  scores: {
    readonly communicationScore: number;
    readonly problemSolvingScore: number;
    readonly professionalismScore: number;
    readonly overallScore: number;
    readonly aiFeedback: string;
  },
): Promise<SimulationRecord> {
  const session = await prisma.simulationSession.update({
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
  scenario: string;
  courseSlug: string;
  messages: unknown;
  status: string;
  communicationScore: number | null;
  problemSolvingScore: number | null;
  professionalismScore: number | null;
  overallScore: number | null;
  aiFeedback: string | null;
  createdAt: Date;
  completedAt: Date | null;
}): SimulationRecord {
  return {
    id: session.id,
    studentId: session.studentId,
    scenario: session.scenario,
    courseSlug: session.courseSlug,
    messages: (session.messages as unknown as SimulationMessage[]) ?? [],
    status: session.status,
    communicationScore: session.communicationScore,
    problemSolvingScore: session.problemSolvingScore,
    professionalismScore: session.professionalismScore,
    overallScore: session.overallScore,
    aiFeedback: session.aiFeedback,
    createdAt: session.createdAt,
    completedAt: session.completedAt,
  };
}
