import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  getCourseLeaderboard,
  isStudentEnrolledInCourse,
  isTrainerOfCourse,
  toInitials,
} from "@/lib/repositories/quiz.repository";

function jsonError(error: string, status: number) {
  return NextResponse.json({ success: false, data: null, error }, { status });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const role = token?.role as string | undefined;
    const userId = token?.id as string | undefined;

    // Allow only student and trainer roles
    if (!userId || (role !== "student" && role !== "trainer")) {
      return jsonError("Unauthorized", 401);
    }

    const { courseId } = await params;

    // ---------- Role-based course access ----------
    if (role === "student") {
      const enrolled = await isStudentEnrolledInCourse(userId, courseId);
      if (!enrolled) {
        return jsonError("Forbidden: not enrolled in this course", 403);
      }
    }

    if (role === "trainer") {
      const ownsIt = await isTrainerOfCourse(userId, courseId);
      if (!ownsIt) {
        return jsonError("Forbidden: course not assigned to you", 403);
      }
    }

    // ---------- Fetch leaderboard ----------
    const rankings = await getCourseLeaderboard(courseId, 10);
    const isTrainerView = role === "trainer";

    const data = rankings.map((entry) => {
      const isCurrentUser = entry.studentId === userId;

      // Name logic:
      //   trainer view  → always full name
      //   student view  → always initials (privacy mode)
      const displayName = isTrainerView
        ? entry.name
        : toInitials(entry.name);

      return {
        rank: entry.rank,
        name: displayName,
        fullName: isTrainerView ? entry.name : undefined, // only in trainer view
        score: entry.score,
        completedAt: entry.completedAt.toISOString(),
        isCurrentUser,
        badge: entry.badge,
      };
    });

    return NextResponse.json({ success: true, data, error: null });
  } catch (err) {
    console.error("[GET /api/student/courses/[courseId]/leaderboard]", err);
    return jsonError("Internal server error", 500);
  }
}
