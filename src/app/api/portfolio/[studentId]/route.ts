import { NextRequest, NextResponse } from "next/server";
import { getPortfolioData } from "@/lib/repositories/portfolio.repository";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;

    if (!studentId || studentId.length < 1) {
      return NextResponse.json(
        { success: false, data: null, error: "Invalid student ID" },
        { status: 400 }
      );
    }

    const data = await getPortfolioData(studentId);

    if (!data || !data.isPublic) {
      return NextResponse.json(
        { success: false, data: null, error: "Portfolio not found or is private" },
        { status: 404 }
      );
    }

    /* Return public portfolio data — exclude isPublic flag from response */
    return NextResponse.json({
      success: true,
      data: {
        studentName: data.studentName,
        courseTitle: data.courseTitle,
        courseSlug: data.courseSlug,
        enrolledAt: data.enrolledAt,
        certificates: data.certificates,
        badges: data.badges,
        quizScores: data.quizScores,
        assignments: data.assignments,
      },
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/portfolio/[studentId]]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
