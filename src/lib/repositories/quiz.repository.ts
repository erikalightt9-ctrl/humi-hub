import { prisma } from "@/lib/prisma";
import type { QuizAttempt } from "@prisma/client";

// ---------------------------------------------------------------------------
// Read helpers
// ---------------------------------------------------------------------------

export async function getQuizzesByCourse(courseId: string) {
  return prisma.quiz.findMany({
    where: { courseId, isPublished: true },
    include: { _count: { select: { questions: true, attempts: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function getAllQuizzesByCourse(courseId: string) {
  return prisma.quiz.findMany({
    where: { courseId },
    include: { _count: { select: { questions: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function getQuizById(id: string) {
  return prisma.quiz.findUnique({ where: { id } });
}

export async function getQuizWithQuestions(quizId: string) {
  return prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: { orderBy: { order: "asc" } } },
  });
}

/** Student view — omits correctAnswer */
export async function getQuizForStudent(quizId: string) {
  return prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          type: true,
          question: true,
          options: true,
          points: true,
          order: true,
          // correctAnswer intentionally excluded
        },
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Attempt helpers
// ---------------------------------------------------------------------------

/** Find the student's single attempt for this quiz (in-progress or submitted) */
export async function getStudentAttempt(studentId: string, quizId: string) {
  return prisma.quizAttempt.findFirst({
    where: { studentId, quizId },
    include: { answers: true },
    orderBy: { completedAt: "desc" },
  });
}

/** Find only an in-progress (not yet submitted) attempt */
export async function getActiveAttempt(studentId: string, quizId: string) {
  return prisma.quizAttempt.findFirst({
    where: { studentId, quizId, isSubmitted: false },
  });
}

// ---------------------------------------------------------------------------
// Start quiz (creates in-progress attempt with shuffled question order)
// ---------------------------------------------------------------------------

function shuffleArray<T>(arr: readonly T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export interface StartAttemptResult {
  attempt: QuizAttempt;
  /** Shuffled questions for this attempt (no correctAnswer) */
  questions: Array<{
    id: string;
    type: string;
    question: string;
    options: string[];
    points: number;
    order: number;
  }>;
  remainingMs: number | null;
}

export async function startQuizAttempt(
  studentId: string,
  quizId: string
): Promise<StartAttemptResult> {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          type: true,
          question: true,
          options: true,
          points: true,
          order: true,
        },
      },
    },
  });
  if (!quiz) throw new Error("Quiz not found");

  // Shuffle question IDs for randomisation
  const shuffledIds = shuffleArray(quiz.questions.map((q) => q.id));

  const now = new Date();
  const endTime =
    quiz.duration != null
      ? new Date(now.getTime() + quiz.duration * 60_000)
      : null;

  const attempt = await prisma.quizAttempt.create({
    data: {
      studentId,
      quizId,
      startTime: now,
      endTime,
      isSubmitted: false,
      questionOrder: shuffledIds,
    },
  });

  // Return questions in shuffled order
  const questionMap = new Map(quiz.questions.map((q) => [q.id, q]));
  const sortedQuestions = shuffledIds
    .map((id) => questionMap.get(id))
    .filter((q): q is NonNullable<typeof q> => q != null);

  const remainingMs =
    endTime != null ? endTime.getTime() - now.getTime() : null;

  return { attempt, questions: sortedQuestions, remainingMs };
}

// ---------------------------------------------------------------------------
// Get attempt status (for page refresh)
// ---------------------------------------------------------------------------

export interface AttemptStatus {
  attempt: QuizAttempt;
  remainingMs: number | null;
  /** Ordered questions for this attempt */
  questions: Array<{
    id: string;
    type: string;
    question: string;
    options: string[];
    points: number;
    order: number;
  }>;
}

export async function getAttemptStatus(
  studentId: string,
  quizId: string
): Promise<AttemptStatus | null> {
  const attempt = await prisma.quizAttempt.findFirst({
    where: { studentId, quizId },
    orderBy: { completedAt: "desc" },
  });
  if (!attempt) return null;

  const now = new Date();
  const remainingMs =
    attempt.endTime != null
      ? Math.max(0, attempt.endTime.getTime() - now.getTime())
      : null;

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: {
        select: {
          id: true,
          type: true,
          question: true,
          options: true,
          points: true,
          order: true,
        },
      },
    },
  });

  if (!quiz) return null;

  const questionMap = new Map(quiz.questions.map((q) => [q.id, q]));
  const orderedQuestions =
    attempt.questionOrder.length > 0
      ? attempt.questionOrder
          .map((id) => questionMap.get(id))
          .filter((q): q is NonNullable<typeof q> => q != null)
      : quiz.questions;

  return { attempt, remainingMs, questions: orderedQuestions };
}

// ---------------------------------------------------------------------------
// Submit attempt (grade answers, mark submitted)
// ---------------------------------------------------------------------------

export interface AnswerInput {
  questionId: string;
  answer: string;
}

export interface SubmitResult {
  attempt: QuizAttempt;
  score: number;
  passed: boolean;
  correct: number;
  total: number;
}

export async function submitAttemptById(
  attemptId: string,
  studentId: string,
  answers: AnswerInput[]
): Promise<SubmitResult> {
  const existing = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
  });
  if (!existing) throw new Error("Attempt not found");
  if (existing.studentId !== studentId) throw new Error("Unauthorized");
  if (existing.isSubmitted) throw new Error("Already submitted");

  const quiz = await getQuizWithQuestions(existing.quizId);
  if (!quiz) throw new Error("Quiz not found");

  let totalPoints = 0;
  let earnedPoints = 0;
  let correctCount = 0;

  const answerRecords = quiz.questions.map((question) => {
    const submitted = answers.find((a) => a.questionId === question.id);
    const answer = submitted?.answer ?? "";
    const isCorrect =
      answer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();

    totalPoints += question.points;
    if (isCorrect) {
      earnedPoints += question.points;
      correctCount++;
    }

    return { questionId: question.id, answer, isCorrect };
  });

  const scorePercent =
    totalPoints === 0 ? 0 : Math.round((earnedPoints / totalPoints) * 100);
  const passed = scorePercent >= quiz.passingScore;

  const updated = await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: {
      isSubmitted: true,
      score: scorePercent,
      passed,
      correct: correctCount,
      total: quiz.questions.length,
      completedAt: new Date(),
      answers: { create: answerRecords },
    },
  });

  return {
    attempt: updated,
    score: scorePercent,
    passed,
    correct: correctCount,
    total: quiz.questions.length,
  };
}

// ---------------------------------------------------------------------------
// Legacy submit (kept for backward compatibility)
// ---------------------------------------------------------------------------

export async function submitQuizAttempt(
  studentId: string,
  quizId: string,
  answers: AnswerInput[]
): Promise<{ attempt: QuizAttempt; score: number; passed: boolean; maxScore: number }> {
  const quiz = await getQuizWithQuestions(quizId);
  if (!quiz) throw new Error("Quiz not found");

  let totalPoints = 0;
  let earnedPoints = 0;

  const answerRecords = quiz.questions.map((question) => {
    const submitted = answers.find((a) => a.questionId === question.id);
    const answer = submitted?.answer ?? "";
    const isCorrect =
      answer.toLowerCase() === question.correctAnswer.toLowerCase();

    totalPoints += question.points;
    if (isCorrect) earnedPoints += question.points;

    return { questionId: question.id, answer, isCorrect };
  });

  const scorePercent =
    totalPoints === 0 ? 0 : Math.round((earnedPoints / totalPoints) * 100);
  const passed = scorePercent >= quiz.passingScore;

  const attempt = await prisma.quizAttempt.create({
    data: {
      studentId,
      quizId,
      score: scorePercent,
      passed,
      isSubmitted: true,
      answers: { create: answerRecords },
    },
    include: { answers: true },
  });

  return { attempt, score: scorePercent, passed, maxScore: totalPoints };
}

// ---------------------------------------------------------------------------
// Anti-cheat: record violation
// ---------------------------------------------------------------------------

export interface ViolationResult {
  violations: number;
  autoSubmitted: boolean;
  submitResult?: SubmitResult;
}

const VIOLATION_THRESHOLD = 3;

export async function recordViolation(
  attemptId: string,
  studentId: string
): Promise<ViolationResult> {
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
  });
  if (!attempt || attempt.studentId !== studentId) {
    throw new Error("Attempt not found");
  }
  if (attempt.isSubmitted) {
    return { violations: attempt.violations, autoSubmitted: false };
  }

  const updated = await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: { violations: { increment: 1 } },
  });

  if (updated.violations >= VIOLATION_THRESHOLD) {
    const submitResult = await submitAttemptById(attemptId, studentId, []);
    return {
      violations: updated.violations,
      autoSubmitted: true,
      submitResult,
    };
  }

  return { violations: updated.violations, autoSubmitted: false };
}

// ---------------------------------------------------------------------------
// Quiz management
// ---------------------------------------------------------------------------

export async function createQuiz(data: {
  courseId: string;
  title: string;
  description?: string;
  passingScore?: number;
  isPublished?: boolean;
  duration?: number;
}) {
  return prisma.quiz.create({ data });
}

export async function createQuizQuestion(data: {
  quizId: string;
  type: "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER";
  question: string;
  options: string[];
  correctAnswer: string;
  points?: number;
  order: number;
}) {
  return prisma.quizQuestion.create({ data });
}

export async function getStudentAttempts(studentId: string, quizId: string) {
  return prisma.quizAttempt.findMany({
    where: { studentId, quizId },
    include: { answers: { include: { question: true } } },
    orderBy: { completedAt: "desc" },
  });
}

// ---------------------------------------------------------------------------
// Analytics (admin)
// ---------------------------------------------------------------------------

export interface QuizAnalytics {
  totalAttempts: number;
  passRate: number;
  avgScore: number;
  avgCorrect: number;
  avgTotal: number;
}

export async function getQuizAnalytics(quizId: string): Promise<QuizAnalytics> {
  const attempts = await prisma.quizAttempt.findMany({
    where: { quizId, isSubmitted: true },
    select: { score: true, passed: true, correct: true, total: true },
  });

  if (attempts.length === 0) {
    return { totalAttempts: 0, passRate: 0, avgScore: 0, avgCorrect: 0, avgTotal: 0 };
  }

  const totalAttempts = attempts.length;
  const passRate = Math.round(
    (attempts.filter((a) => a.passed).length / totalAttempts) * 100
  );
  const avgScore = Math.round(
    attempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts
  );
  const avgCorrect = Math.round(
    (attempts.reduce((sum, a) => sum + a.correct, 0) / totalAttempts) * 10
  ) / 10;
  const avgTotal = Math.round(
    (attempts.reduce((sum, a) => sum + a.total, 0) / totalAttempts) * 10
  ) / 10;

  return { totalAttempts, passRate, avgScore, avgCorrect, avgTotal };
}

// ---------------------------------------------------------------------------
// Leaderboard (per course)
// ---------------------------------------------------------------------------

export type LeaderboardBadge = "gold" | "silver" | "bronze" | null;

export interface LeaderboardEntry {
  rank: number;
  studentId: string;
  name: string;
  score: number;
  completedAt: Date;
  badge: LeaderboardBadge;
}

function assignBadge(rank: number): LeaderboardBadge {
  if (rank === 1) return "gold";
  if (rank === 2) return "silver";
  if (rank === 3) return "bronze";
  return null;
}

/** Convert "John Doe" → "J.D." for privacy in student view */
export function toInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + ".")
    .join("");
}

/** Verify a student is enrolled in the course */
export async function isStudentEnrolledInCourse(
  studentId: string,
  courseId: string
): Promise<boolean> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { enrollment: { select: { courseId: true } } },
  });
  return student?.enrollment?.courseId === courseId;
}

/** Verify a trainer teaches the course (via CourseTrainer join table) */
export async function isTrainerOfCourse(
  trainerId: string,
  courseId: string
): Promise<boolean> {
  const link = await prisma.courseTrainer.findFirst({
    where: { courseId, trainerId },
    select: { id: true },
  });
  return link != null;
}

export async function getCourseLeaderboard(
  courseId: string,
  limit = 10
): Promise<LeaderboardEntry[]> {
  // Get all submitted attempts for all quizzes in this course
  const attempts = await prisma.quizAttempt.findMany({
    where: {
      isSubmitted: true,
      quiz: { courseId },
    },
    select: {
      studentId: true,
      score: true,
      completedAt: true,
      student: { select: { name: true } },
    },
  });

  // Group by student: keep highest score; on tie, earliest completedAt
  const byStudent = new Map<
    string,
    { name: string; score: number; completedAt: Date }
  >();

  for (const a of attempts) {
    const existing = byStudent.get(a.studentId);
    if (
      !existing ||
      a.score > existing.score ||
      (a.score === existing.score && a.completedAt < existing.completedAt)
    ) {
      byStudent.set(a.studentId, {
        name: a.student.name,
        score: a.score,
        completedAt: a.completedAt,
      });
    }
  }

  // Sort: score DESC, completedAt ASC, then slice to limit
  const sorted = [...byStudent.entries()]
    .sort(([, a], [, b]) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.completedAt.getTime() - b.completedAt.getTime();
    })
    .slice(0, limit);

  return sorted.map(([studentId, entry], idx) => {
    const rank = idx + 1;
    return {
      rank,
      studentId,
      name: entry.name,
      score: entry.score,
      completedAt: entry.completedAt,
      badge: assignBadge(rank),
    };
  });
}
