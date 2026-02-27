import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { getAllQuizzesByCourse, createQuiz, createQuizQuestion } from "@/lib/repositories/quiz.repository";

const questionSchema = z.object({
  type: z.enum(["MCQ", "TRUE_FALSE", "SHORT_ANSWER"]),
  question: z.string().min(1),
  options: z.array(z.string()),
  correctAnswer: z.string(),
  points: z.number().int().min(1).optional(),
  order: z.number().int().min(1),
});

const createSchema = z.object({
  courseId: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  passingScore: z.number().int().min(1).max(100).optional(),
  isPublished: z.boolean().optional(),
  questions: z.array(questionSchema).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id || token.role !== "admin") {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = request.nextUrl;
    const courseId = searchParams.get("courseId");
    if (!courseId) {
      return NextResponse.json({ success: false, data: null, error: "courseId is required" }, { status: 422 });
    }
    const quizzes = await getAllQuizzesByCourse(courseId);
    return NextResponse.json({ success: true, data: quizzes, error: null });
  } catch (err) {
    console.error("[GET /api/admin/quizzes]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id || token.role !== "admin") {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const result = createSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ success: false, data: null, error: "Invalid input" }, { status: 422 });
    }
    const { questions, ...quizData } = result.data;
    const quiz = await createQuiz(quizData);
    if (questions && questions.length > 0) {
      for (const q of questions) {
        await createQuizQuestion({ ...q, quizId: quiz.id });
      }
    }
    return NextResponse.json({ success: true, data: quiz, error: null }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/quizzes]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
