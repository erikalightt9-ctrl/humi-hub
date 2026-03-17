import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { z } from "zod";
import {
  getAllLessonsByCourse,
  getAllLessonsByCourseTier,
  createLesson,
} from "@/lib/repositories/lesson.repository";

const courseTierEnum = z.enum(["BASIC", "PROFESSIONAL", "ADVANCED"]);

const createSchema = z.object({
  courseId: z.string(),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  order: z.number().int().min(1),
  durationMin: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
  isFreePreview: z.boolean().optional(),
  tier: courseTierEnum.optional(),
  videoUrl: z.string().url().nullable().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;
    const { searchParams } = request.nextUrl;
    const courseId = searchParams.get("courseId");
    if (!courseId) {
      return NextResponse.json({ success: false, data: null, error: "courseId is required" }, { status: 422 });
    }
    const tier = searchParams.get("tier");
    const validTier = courseTierEnum.safeParse(tier);
    const lessons = validTier.success
      ? await getAllLessonsByCourseTier(courseId, validTier.data)
      : await getAllLessonsByCourse(courseId);
    return NextResponse.json({ success: true, data: lessons, error: null });
  } catch (err) {
    console.error("[GET /api/admin/lessons]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;
    const body = await request.json();
    const result = createSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ success: false, data: null, error: "Invalid input" }, { status: 422 });
    }
    const lesson = await createLesson(result.data);
    return NextResponse.json({ success: true, data: lesson, error: null }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/lessons]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
