import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getTrainerCourseDetail } from "@/lib/repositories/trainer.repository";

/* ------------------------------------------------------------------ */
/*  GET — Trainer: course detail with lessons/assignments/quizzes      */
/* ------------------------------------------------------------------ */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
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

    const { courseId } = await params;
    const trainerId = token.id as string;
    const detail = await getTrainerCourseDetail(trainerId, courseId);

    if (!detail) {
      return NextResponse.json(
        { success: false, data: null, error: "Course not found or not assigned" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: detail,
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/trainer/courses/[courseId]]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
