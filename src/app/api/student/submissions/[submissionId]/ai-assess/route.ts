import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import {
  assessSubmission,
  canAssess,
} from "@/lib/services/ai-assessment.service";

/* ------------------------------------------------------------------ */
/*  POST — Trigger AI assessment for a submission                      */
/* ------------------------------------------------------------------ */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> },
) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id || token.role !== "student") {
      return NextResponse.json(
        { success: false, data: null, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { submissionId } = await params;
    const studentId = token.id as string;

    // Verify student owns this submission
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      select: { studentId: true },
    });

    if (!submission) {
      return NextResponse.json(
        { success: false, data: null, error: "Submission not found" },
        { status: 404 },
      );
    }

    if (submission.studentId !== studentId) {
      return NextResponse.json(
        { success: false, data: null, error: "Unauthorized" },
        { status: 403 },
      );
    }

    // Check rate limit
    const allowed = await canAssess(submissionId);
    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: "AI review can only be requested once every 24 hours per submission",
        },
        { status: 429 },
      );
    }

    const result = await assessSubmission(submissionId);

    return NextResponse.json({
      success: true,
      data: result,
      error: null,
    });
  } catch (err) {
    console.error("[POST /api/student/submissions/[submissionId]/ai-assess]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
