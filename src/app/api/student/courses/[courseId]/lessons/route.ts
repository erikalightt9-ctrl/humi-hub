import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getLessonsByCourse, getCompletedLessonIds } from "@/lib/repositories/lesson.repository";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id || token.role !== "student") {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }
    const studentId = token.id as string;
    const { courseId } = await params;
    const [lessons, completedIds] = await Promise.all([
      getLessonsByCourse(courseId),
      getCompletedLessonIds(studentId, courseId),
    ]);
    const completedSet = new Set(completedIds);
    const data = lessons.map((l) => ({ ...l, completed: completedSet.has(l.id) }));
    return NextResponse.json({ success: true, data, error: null });
  } catch (err) {
    console.error("[GET /api/student/courses/[courseId]/lessons]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
