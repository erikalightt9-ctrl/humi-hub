import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { completeLessonForStudent } from "@/lib/services/lesson.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id || token.role !== "student") {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }
    const studentId = token.id as string;
    const { lessonId } = await params;
    const result = await completeLessonForStudent(studentId, lessonId);
    return NextResponse.json({ success: true, data: result, error: null });
  } catch (err) {
    console.error("[POST /api/student/lessons/[lessonId]/complete]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
