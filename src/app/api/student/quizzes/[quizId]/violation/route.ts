import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import {
  getStudentAttempt,
  recordViolation,
} from "@/lib/repositories/quiz.repository";

const bodySchema = z.object({ attemptId: z.string() });

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
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Invalid request body", 422);
    }

    const attempt = await getStudentAttempt(studentId, quizId);
    if (!attempt || attempt.id !== parsed.data.attemptId) {
      return jsonError("No active attempt", 404);
    }
    if (attempt.isSubmitted) {
      return NextResponse.json({
        success: true,
        data: { violations: attempt.violations, autoSubmitted: false },
        error: null,
      });
    }

    const result = await recordViolation(parsed.data.attemptId, studentId);

    return NextResponse.json({
      success: true,
      data: {
        violations: result.violations,
        autoSubmitted: result.autoSubmitted,
        ...(result.autoSubmitted && result.submitResult
          ? {
              score: result.submitResult.score,
              passed: result.submitResult.passed,
            }
          : {}),
      },
      error: null,
    });
  } catch (err) {
    console.error("[POST /api/student/quizzes/[quizId]/violation]", err);
    return jsonError("Failed to record violation", 500);
  }
}
