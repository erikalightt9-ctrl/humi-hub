import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import {
  getAllAssignmentsByCourse,
  createAssignment,
  getAssignmentAnalytics,
} from "@/lib/repositories/assignment.repository";

const submissionTypeEnum = z.enum(["FILE_UPLOAD", "TEXT_RESPONSE", "EXTERNAL_LINK", "TASK_COMPLETION"]);

const createSchema = z.object({
  courseId: z.string().min(1),
  lessonId: z.string().optional().nullable(),
  moduleId: z.string().optional().nullable(),
  title: z.string().min(1).max(200),
  description: z.string().optional().nullable(),
  instructions: z.string().min(1),
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

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id || token.role !== "admin") {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = request.nextUrl;
    const courseId = searchParams.get("courseId");
    const analytics = searchParams.get("analytics");

    if (analytics === "true") {
      const data = await getAssignmentAnalytics();
      return NextResponse.json({ success: true, data, error: null });
    }

    if (!courseId) {
      return NextResponse.json({ success: false, data: null, error: "courseId is required" }, { status: 422 });
    }
    const assignments = await getAllAssignmentsByCourse(courseId);
    return NextResponse.json({ success: true, data: assignments, error: null });
  } catch (err) {
    console.error("[GET /api/admin/assignments]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id || token.role !== "admin") {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const result = createSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ success: false, data: null, error: result.error.issues[0].message }, { status: 422 });
    }
    const { dueDate, startDate, rubric, ...rest } = result.data;
    const assignment = await createAssignment({
      ...rest,
      dueDate: dueDate ? new Date(dueDate) : null,
      startDate: startDate ? new Date(startDate) : null,
      rubric: rubric ?? null,
    });
    return NextResponse.json({ success: true, data: assignment, error: null }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/assignments]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
