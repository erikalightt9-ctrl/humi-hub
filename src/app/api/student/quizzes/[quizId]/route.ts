import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getQuizForStudent } from "@/lib/repositories/quiz.repository";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id || token.role !== "student") {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }
    const { quizId } = await params;
    const quiz = await getQuizForStudent(quizId);
    if (!quiz) {
      return NextResponse.json({ success: false, data: null, error: "Quiz not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: quiz, error: null });
  } catch (err) {
    console.error("[GET /api/student/quizzes/[quizId]]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
