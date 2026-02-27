import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { getAllLessonsByCourse, createLesson } from "@/lib/repositories/lesson.repository";

const createSchema = z.object({
  courseId: z.string(),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  order: z.number().int().min(1),
  durationMin: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
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
    const lessons = await getAllLessonsByCourse(courseId);
    return NextResponse.json({ success: true, data: lessons, error: null });
  } catch (err) {
    console.error("[GET /api/admin/lessons]", err);
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
    const lesson = await createLesson(result.data);
    return NextResponse.json({ success: true, data: lesson, error: null }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/lessons]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
