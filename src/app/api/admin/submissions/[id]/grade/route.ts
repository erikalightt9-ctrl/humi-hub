import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { gradeSubmission } from "@/lib/repositories/assignment.repository";

const gradeSchema = z.object({
  grade: z.number().int().min(0).max(1000),
  feedback: z.string().min(1),
  rubricScores: z.record(z.string(), z.number()).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id || token.role !== "admin") {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    const result = gradeSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ success: false, data: null, error: result.error.issues[0].message }, { status: 422 });
    }
    const submission = await gradeSubmission(
      id,
      result.data.grade,
      result.data.feedback,
      token.id as string,
      result.data.rubricScores
    );
    return NextResponse.json({ success: true, data: submission, error: null });
  } catch (err) {
    console.error("[PATCH /api/admin/submissions/[id]/grade]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
