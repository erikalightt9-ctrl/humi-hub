import { NextRequest, NextResponse } from "next/server";
import { listOpenSchedulesByCourse } from "@/lib/repositories/schedule.repository";

/* ------------------------------------------------------------------ */
/*  GET — Public: list open schedules for a course (enrollment form)   */
/*  Query param: courseId (required)                                    */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json(
        { success: false, data: null, error: "courseId is required" },
        { status: 400 },
      );
    }

    const schedules = await listOpenSchedulesByCourse(courseId);

    return NextResponse.json({
      success: true,
      data: schedules,
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/public/schedules]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
