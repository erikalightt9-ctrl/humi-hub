import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getCourseLeaderboard } from "@/lib/repositories/quiz.repository";

function jsonError(error: string, status: number) {
  return NextResponse.json({ success: false, data: null, error }, { status });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id || token.role !== "student") {
      return jsonError("Unauthorized", 401);
    }
    const studentId = token.id as string;
    const { courseId } = await params;

    const rankings = await getCourseLeaderboard(courseId, 10);

    // Current user always sees their own name; top 3 are shown; rest anonymized
    const data = rankings.map((entry) => ({
      rank: entry.rank,
      name:
        entry.studentId === studentId || entry.rank <= 3
          ? entry.name
          : `Student #${entry.rank}`,
      score: entry.score,
      completedAt: entry.completedAt.toISOString(),
      isCurrentUser: entry.studentId === studentId,
    }));

    return NextResponse.json({ success: true, data, error: null });
  } catch (err) {
    console.error("[GET /api/student/courses/[courseId]/leaderboard]", err);
    return jsonError("Internal server error", 500);
  }
}
