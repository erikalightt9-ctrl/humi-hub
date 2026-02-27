import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getLeaderboard } from "@/lib/repositories/gamification.repository";

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
    const leaderboard = await getLeaderboard(courseId);
    return NextResponse.json({ success: true, data: leaderboard, error: null });
  } catch (err) {
    console.error("[GET /api/student/courses/[courseId]/leaderboard]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
