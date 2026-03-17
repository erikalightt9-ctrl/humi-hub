import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { getAssignmentAnalytics, getAllSubmissions } from "@/lib/repositories/assignment.repository";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const [analytics, recentSubmissions, trainerStats] = await Promise.all([
      getAssignmentAnalytics(),
      getAllSubmissions({ status: "PENDING" }),
      // Average grading time per trainer (gradedBy)
      prisma.submission.groupBy({
        by: ["gradedBy"],
        where: { status: "GRADED", gradedBy: { not: null } },
        _avg: { grade: true },
        _count: { id: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ...analytics,
        pendingReview: recentSubmissions.length,
        trainerStats,
      },
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/admin/assignments/analytics]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
