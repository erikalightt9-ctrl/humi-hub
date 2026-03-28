import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  getStudentAttempt,
  startQuizAttempt,
  getAttemptStatus,
} from "@/lib/repositories/quiz.repository";
import { prisma } from "@/lib/prisma";

function jsonError(error: string, status: number) {
  return NextResponse.json({ success: false, data: null, error }, { status });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id || token.role !== "student") {
      return jsonError("Unauthorized", 401);
    }
    const studentId = token.id as string;
    const { quizId } = await params;

    // Validate quiz exists and is published
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: { id: true, isPublished: true },
    });
    if (!quiz || !quiz.isPublished) {
      return jsonError("Quiz not found", 404);
    }

    // Enforce single attempt rule
    const existing = await getStudentAttempt(studentId, quizId);
    if (existing?.isSubmitted) {
      return jsonError("You have already completed this quiz", 409);
    }

    // Resume in-progress attempt if it exists
    if (existing && !existing.isSubmitted) {
      const status = await getAttemptStatus(studentId, quizId);
      if (status) {
        return NextResponse.json({
          success: true,
          data: {
            attemptId: status.attempt.id,
            questions: status.questions,
            remainingMs: status.remainingMs,
            isResumed: true,
          },
          error: null,
        });
      }
    }

    const result = await startQuizAttempt(studentId, quizId);
    return NextResponse.json({
      success: true,
      data: {
        attemptId: result.attempt.id,
        questions: result.questions,
        remainingMs: result.remainingMs,
        isResumed: false,
      },
      error: null,
    });
  } catch (err) {
    console.error("[POST /api/student/quizzes/[quizId]/start]", err);
    return jsonError("Failed to start quiz", 500);
  }
}
