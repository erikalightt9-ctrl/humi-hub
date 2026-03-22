/**
 * GET /api/admin/attendance/analytics/[courseId]
 *
 * Returns attendance analytics for a specific course.
 * Admin-only. Includes totals, attendance rate, avg duration,
 * daily breakdown (last 30 days), and top students.
 */
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { getAttendanceAnalyticsByCourse } from "@/lib/repositories/attendance.repository";

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
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { courseId } = await params;
    const analytics = await getAttendanceAnalyticsByCourse(courseId);

    return NextResponse.json({ success: true, data: analytics, error: null });
  } catch (err) {
    console.error("[GET /api/admin/attendance/analytics/[courseId]]", err);
    return jsonError("Internal server error", 500);
  }
}
