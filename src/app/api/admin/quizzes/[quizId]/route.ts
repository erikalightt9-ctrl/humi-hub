import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { getQuizAnalytics } from "@/lib/repositories/quiz.repository";

function jsonError(error: string, status: number) {
  return NextResponse.json({ success: false, data: null, error }, { status });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { quizId } = await params;
    const analytics = await getQuizAnalytics(quizId);

    return NextResponse.json({ success: true, data: analytics, error: null });
  } catch (err) {
    console.error("[GET /api/admin/quizzes/[quizId]]", err);
    return jsonError("Failed to fetch analytics", 500);
  }
}
