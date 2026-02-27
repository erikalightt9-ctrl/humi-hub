import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { getThreadsByCourse, createThread } from "@/lib/repositories/forum.repository";
import { onForumPost } from "@/lib/services/gamification.service";

const createSchema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(1).max(5000),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id || token.role !== "student") {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }
    const { courseId } = await params;
    const threads = await getThreadsByCourse(courseId);
    return NextResponse.json({ success: true, data: threads, error: null });
  } catch (err) {
    console.error("[GET /api/student/courses/[courseId]/forum]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
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
    const body = await request.json();
    const result = createSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ success: false, data: null, error: "Invalid input" }, { status: 422 });
    }
    const thread = await createThread(courseId, studentId, result.data.title, result.data.content);
    await onForumPost(studentId);
    return NextResponse.json({ success: true, data: thread, error: null }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/student/courses/[courseId]/forum]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
