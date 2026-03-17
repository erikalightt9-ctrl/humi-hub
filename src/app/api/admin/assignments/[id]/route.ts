import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { z } from "zod";
import {
  updateAssignment,
  deleteAssignment,
  getAssignmentById,
  getSubmissionsByAssignment,
} from "@/lib/repositories/assignment.repository";

const submissionTypeEnum = z.enum(["FILE_UPLOAD", "TEXT_RESPONSE", "EXTERNAL_LINK", "TASK_COMPLETION"]);

const updateSchema = z.object({
  lessonId: z.string().optional().nullable(),
  moduleId: z.string().optional().nullable(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  instructions: z.string().min(1).optional(),
  submissionType: submissionTypeEnum.optional(),
  dueDate: z.string().datetime().optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  maxPoints: z.number().int().min(1).max(1000).optional(),
  passingScore: z.number().int().min(0).max(100).optional(),
  allowLateSubmission: z.boolean().optional(),
  allowResubmission: z.boolean().optional(),
  maxFileSizeMB: z.number().int().min(1).max(100).optional(),
  allowedFileTypes: z.array(z.string()).optional(),
  rubric: z.array(z.object({
    criterion: z.string(),
    maxPoints: z.number(),
    description: z.string().optional(),
  })).optional().nullable(),
  isPublished: z.boolean().optional(),
  isRequired: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;
    const { id } = await params;
    const { searchParams } = request.nextUrl;
    const withSubmissions = searchParams.get("submissions") === "true";

    if (withSubmissions) {
      const submissions = await getSubmissionsByAssignment(id);
      return NextResponse.json({ success: true, data: submissions, error: null });
    }

    const assignment = await getAssignmentById(id);
    if (!assignment) {
      return NextResponse.json({ success: false, data: null, error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: assignment, error: null });
  } catch (err) {
    console.error("[GET /api/admin/assignments/[id]]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;
    const { id } = await params;
    const body = await request.json();
    const result = updateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ success: false, data: null, error: result.error.issues[0].message }, { status: 422 });
    }
    const { dueDate, startDate, rubric, ...rest } = result.data;
    const updated = await updateAssignment(id, {
      ...rest,
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
      ...(rubric !== undefined && { rubric: rubric ?? null }),
    });
    return NextResponse.json({ success: true, data: updated, error: null });
  } catch (err) {
    console.error("[PATCH /api/admin/assignments/[id]]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;
    const { id } = await params;
    await deleteAssignment(id);
    return NextResponse.json({ success: true, data: null, error: null });
  } catch (err) {
    console.error("[DELETE /api/admin/assignments/[id]]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
