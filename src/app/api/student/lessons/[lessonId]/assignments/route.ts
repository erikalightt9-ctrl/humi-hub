import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getAssignmentsByLesson } from "@/lib/repositories/assignment.repository";
import { prisma } from "@/lib/prisma";

export async function GET(
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

    const assignments = await getAssignmentsByLesson(lessonId);

    // Attach submission status for each assignment
    const withSubmissions = await Promise.all(
      assignments.map(async (a) => {
        const submission = await prisma.submission.findUnique({
          where: { assignmentId_studentId: { assignmentId: a.id, studentId } },
          select: {
            id: true,
            status: true,
            grade: true,
            feedback: true,
            submittedAt: true,
            fileName: true,
            linkUrl: true,
            taskCompleted: true,
          },
        });
        return { ...a, submission };
      })
    );

    return NextResponse.json({ success: true, data: withSubmissions, error: null });
  } catch (err) {
    console.error("[GET /api/student/lessons/[lessonId]/assignments]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
