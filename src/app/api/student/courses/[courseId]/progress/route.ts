import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getCourseProgress } from "@/lib/repositories/lesson.repository";

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
    const progress = await getCourseProgress(studentId, courseId);
    return NextResponse.json({ success: true, data: progress, error: null });
  } catch (err) {
    console.error("[GET /api/student/courses/[courseId]/progress]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
