import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import {
  getStudentAttempt,
  submitAttemptById,
} from "@/lib/repositories/quiz.repository";
import { onQuizPassed } from "@/lib/services/gamification.service";
import { sendQuizPassed } from "@/lib/services/notification.service";
import { updateCourseLeaderboard } from "@/lib/services/leaderboard.service";
import { prisma } from "@/lib/prisma";

const attemptSchema = z.object({
  attemptId: z.string(),
  answers: z.array(
    z.object({ questionId: z.string(), answer: z.string() })
  ),
});

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

    const body = await request.json();
    const result = attemptSchema.safeParse(body);
    if (!result.success) {
      return jsonError("Invalid request body", 422);
    }

    const { attemptId, answers } = result.data;

    // Verify attempt belongs to this student and quiz
    const attempt = await getStudentAttempt(studentId, quizId);
    if (!attempt || attempt.id !== attemptId) {
      return jsonError("No active attempt found", 409);
    }
    if (attempt.isSubmitted) {
      return jsonError("Quiz already submitted", 409);
    }

    const submitResult = await submitAttemptById(attemptId, studentId, answers);

    if (submitResult.passed) {
      await onQuizPassed(studentId);

      // Non-blocking notifications
      const [student, quiz] = await Promise.all([
        prisma.student.findUnique({
          where: { id: studentId },
          select: { name: true, email: true },
        }),
        prisma.quiz.findUnique({
          where: { id: quizId },
          select: {
            title: true,
            passingScore: true,
            courseId: true,
            course: { select: { title: true } },
          },
        }),
      ]);

      if (student && quiz) {
        sendQuizPassed({
          name: student.name,
          email: student.email,
          quizTitle: quiz.title,
          courseTitle: quiz.course.title,
          score: submitResult.score,
          passingScore: quiz.passingScore,
        });

        // Update leaderboard non-blocking
        updateCourseLeaderboard(quiz.courseId).catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        score: submitResult.score,
        passed: submitResult.passed,
        correct: submitResult.correct,
        total: submitResult.total,
      },
      error: null,
    });
  } catch (err) {
    console.error("[POST /api/student/quizzes/[quizId]/attempt]", err);
    return jsonError("Failed to submit quiz", 500);
  }
}
