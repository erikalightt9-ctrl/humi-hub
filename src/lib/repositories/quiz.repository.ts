import { prisma } from "@/lib/prisma";
import type { Quiz, QuizAttempt } from "@prisma/client";

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

export async function getQuizById(id: string): Promise<Quiz | null> {
  return prisma.quiz.findUnique({ where: { id } });
}

export async function getQuizWithQuestions(quizId: string) {
  return prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: { orderBy: { order: "asc" } },
    },
  });
}

export async function getQuizForStudent(quizId: string) {
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
          // NOTE: correctAnswer is NOT included for student view
        },
      },
    },
  });
  return quiz;
}

export async function createQuiz(data: {
  courseId: string;
  title: string;
  description?: string;
  passingScore?: number;
  isPublished?: boolean;
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

export interface AnswerInput {
  questionId: string;
  answer: string;
}

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
    const isCorrect = answer.toLowerCase() === question.correctAnswer.toLowerCase();

    totalPoints += question.points;
    if (isCorrect) earnedPoints += question.points;

    return {
      questionId: question.id,
      answer,
      isCorrect,
    };
  });

  const scorePercent = totalPoints === 0 ? 0 : Math.round((earnedPoints / totalPoints) * 100);
  const passed = scorePercent >= quiz.passingScore;

  const attempt = await prisma.quizAttempt.create({
    data: {
      studentId,
      quizId,
      score: scorePercent,
      passed,
      answers: {
        create: answerRecords,
      },
    },
    include: { answers: true },
  });

  return { attempt, score: scorePercent, passed, maxScore: totalPoints };
}

export async function getStudentAttempts(studentId: string, quizId: string) {
  return prisma.quizAttempt.findMany({
    where: { studentId, quizId },
    include: {
      answers: {
        include: { question: true },
      },
    },
    orderBy: { completedAt: "desc" },
  });
}
