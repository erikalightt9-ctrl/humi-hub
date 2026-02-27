import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { submitQuizAttempt } from "@/lib/repositories/quiz.repository";
import { onQuizPassed } from "@/lib/services/gamification.service";

const attemptSchema = z.object({
  answers: z.array(z.object({
    questionId: z.string(),
    answer: z.string(),
  })),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id || token.role !== "student") {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }
    const studentId = token.id as string;
    const { quizId } = await params;
    const body = await request.json();
    const result = attemptSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ success: false, data: null, error: "Invalid request body" }, { status: 422 });
    }
    const attemptResult = await submitQuizAttempt(studentId, quizId, result.data.answers);
    if (attemptResult.passed) {
      await onQuizPassed(studentId);
    }
    return NextResponse.json({ success: true, data: attemptResult, error: null });
  } catch (err) {
    console.error("[POST /api/student/quizzes/[quizId]/attempt]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
