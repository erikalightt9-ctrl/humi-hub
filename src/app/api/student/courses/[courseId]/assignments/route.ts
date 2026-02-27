import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getAssignmentsByCourse, getStudentSubmission } from "@/lib/repositories/assignment.repository";

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
    const assignments = await getAssignmentsByCourse(courseId);
    const withSubmissions = await Promise.all(
      assignments.map(async (a) => ({
        ...a,
        submission: await getStudentSubmission(a.id, studentId),
      }))
    );
    return NextResponse.json({ success: true, data: withSubmissions, error: null });
  } catch (err) {
    console.error("[GET /api/student/courses/[courseId]/assignments]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
