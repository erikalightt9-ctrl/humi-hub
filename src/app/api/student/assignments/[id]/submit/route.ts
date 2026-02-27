import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createSubmission } from "@/lib/repositories/assignment.repository";
import { handleFileUpload } from "@/lib/services/assignment.service";
import { onAssignmentSubmitted } from "@/lib/services/gamification.service";

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
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ success: false, data: null, error: "No file provided" }, { status: 422 });
    }
    const uploaded = await handleFileUpload(file);
    const submission = await createSubmission({
      assignmentId,
      studentId,
      ...uploaded,
    });
    await onAssignmentSubmitted(studentId);
    return NextResponse.json({ success: true, data: submission, error: null }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[POST /api/student/assignments/[id]/submit]", err);
    return NextResponse.json({ success: false, data: null, error: message }, { status: 500 });
  }
}
