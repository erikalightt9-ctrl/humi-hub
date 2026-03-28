/**
 * GET /api/trainer/attendance/[courseId]
 *
 * Returns live attendance records for a course.
 * Restricted to trainers assigned to that course.
 *
 * Query params:
 *   activeOnly=1  →  only currently clocked-in students
 */
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireTrainer } from "@/lib/auth-guards";
import { getAttendanceByCourse } from "@/lib/repositories/attendance.repository";
import { prisma } from "@/lib/prisma";

function jsonError(msg: string, status: number) {
  return NextResponse.json(
    { success: false, data: null, error: msg },
    { status },
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    const guard = requireTrainer(token);
    if (!guard.ok) return guard.response;

    const { courseId } = await params;
    const trainerId = token!.id as string;

    // Verify trainer is assigned to this course
    const assignment = await prisma.courseTrainer.findUnique({
      where: { courseId_trainerId: { courseId, trainerId } },
    });
    if (!assignment) {
      return jsonError("Forbidden: not assigned to this course", 403);
    }

    const activeOnly =
      request.nextUrl.searchParams.get("activeOnly") === "1";

    const records = await getAttendanceByCourse(courseId, { activeOnly });

    return NextResponse.json({ success: true, data: records, error: null });
  } catch (err) {
    console.error("[GET /api/trainer/attendance/[courseId]]", err);
    return jsonError("Internal server error", 500);
  }
}
