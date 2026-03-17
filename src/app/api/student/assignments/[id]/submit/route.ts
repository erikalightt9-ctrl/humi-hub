import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createSubmission, getAssignmentById } from "@/lib/repositories/assignment.repository";
import { handleFileUpload } from "@/lib/services/assignment.service";
import { onAssignmentSubmitted } from "@/lib/services/gamification.service";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id || token.role !== "student") {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }
    const studentId = token.id as string;
    const { id: assignmentId } = await params;

    const assignment = await getAssignmentById(assignmentId);
    if (!assignment) {
      return NextResponse.json({ success: false, data: null, error: "Assignment not found" }, { status: 404 });
    }

    // Check if already graded (can't resubmit unless allowResubmission)
    const existing = await prisma.submission.findUnique({
      where: { assignmentId_studentId: { assignmentId, studentId } },
    });
    if (existing?.status === "GRADED" && !assignment.allowResubmission) {
      return NextResponse.json({
        success: false,
        data: null,
        error: "This assignment has already been graded. Resubmission is not allowed.",
      }, { status: 422 });
    }

    const contentType = request.headers.get("content-type") ?? "";

    // ── FILE_UPLOAD ──────────────────────────────────────────────────────────
    if (assignment.submissionType === "FILE_UPLOAD") {
      if (!contentType.includes("multipart/form-data")) {
        return NextResponse.json({ success: false, data: null, error: "File upload required" }, { status: 422 });
      }
      const formData = await request.formData();
      const file = formData.get("file");
      if (!file || !(file instanceof File)) {
        return NextResponse.json({ success: false, data: null, error: "No file provided" }, { status: 422 });
      }
      const uploaded = await handleFileUpload(file, assignment.maxFileSizeMB);
      const submission = await createSubmission({ assignmentId, studentId, ...uploaded });
      await onAssignmentSubmitted(studentId);
      return NextResponse.json({ success: true, data: submission, error: null }, { status: 201 });
    }

    // ── TEXT_RESPONSE, EXTERNAL_LINK, TASK_COMPLETION ────────────────────────
    const body = await request.json().catch(() => ({}));

    if (assignment.submissionType === "TEXT_RESPONSE") {
      const textAnswer = (body.textAnswer as string | undefined)?.trim();
      if (!textAnswer) {
        return NextResponse.json({ success: false, data: null, error: "Text answer is required" }, { status: 422 });
      }
      const submission = await createSubmission({ assignmentId, studentId, textAnswer });
      await onAssignmentSubmitted(studentId);
      return NextResponse.json({ success: true, data: submission, error: null }, { status: 201 });
    }

    if (assignment.submissionType === "EXTERNAL_LINK") {
      const linkUrl = (body.linkUrl as string | undefined)?.trim();
      if (!linkUrl || !/^https?:\/\/.+/.test(linkUrl)) {
        return NextResponse.json({ success: false, data: null, error: "Valid URL is required (must start with http/https)" }, { status: 422 });
      }
      const submission = await createSubmission({ assignmentId, studentId, linkUrl });
      await onAssignmentSubmitted(studentId);
      return NextResponse.json({ success: true, data: submission, error: null }, { status: 201 });
    }

    if (assignment.submissionType === "TASK_COMPLETION") {
      const submission = await createSubmission({ assignmentId, studentId, taskCompleted: true });
      await onAssignmentSubmitted(studentId);
      return NextResponse.json({ success: true, data: submission, error: null }, { status: 201 });
    }

    return NextResponse.json({ success: false, data: null, error: "Unknown submission type" }, { status: 422 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[POST /api/student/assignments/[id]/submit]", err);
    return NextResponse.json({ success: false, data: null, error: message }, { status: 500 });
  }
}
