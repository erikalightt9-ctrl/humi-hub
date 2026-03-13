import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { gradeSubmission } from "@/lib/repositories/assignment.repository";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  PATCH — Trainer: grade a student submission                        */
/* ------------------------------------------------------------------ */

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id || token.role !== "trainer") {
      return NextResponse.json(
        { success: false, data: null, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id: submissionId } = await params;
    const trainerId = token.id as string;

    // Verify the submission belongs to one of the trainer's students
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { student: { select: { trainerId: true } } },
    });

    if (!submission) {
      return NextResponse.json(
        { success: false, data: null, error: "Submission not found" },
        { status: 404 },
      );
    }

    if (submission.student.trainerId !== trainerId) {
      return NextResponse.json(
        { success: false, data: null, error: "Not authorized to grade this submission" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const grade = Number(body.grade);
    const feedback = String(body.feedback ?? "");

    if (isNaN(grade) || grade < 0 || grade > 100) {
      return NextResponse.json(
        { success: false, data: null, error: "Grade must be between 0 and 100" },
        { status: 400 },
      );
    }

    const graded = await gradeSubmission(submissionId, grade, feedback);

    return NextResponse.json({
      success: true,
      data: graded,
      error: null,
    });
  } catch (err) {
    console.error("[PATCH /api/trainer/submissions/[id]/grade]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
