import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getStudentPoints, getStudentBadges, getStudentPointHistory } from "@/lib/repositories/gamification.repository";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id || token.role !== "student") {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }
    const studentId = token.id as string;
    const [points, badges, history] = await Promise.all([
      getStudentPoints(studentId),
      getStudentBadges(studentId),
      getStudentPointHistory(studentId),
    ]);
    return NextResponse.json({ success: true, data: { points, badges, history }, error: null });
  } catch (err) {
    console.error("[GET /api/student/gamification]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
