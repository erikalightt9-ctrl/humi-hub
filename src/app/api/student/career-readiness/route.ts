import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  getLatestScore,
  getScoreHistory,
} from "@/lib/repositories/career-readiness.repository";
import {
  calculateCareerReadiness,
  canEvaluate,
} from "@/lib/services/career-readiness.service";

/* ------------------------------------------------------------------ */
/*  GET — Return latest score + history                                */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id || token.role !== "student") {
      return NextResponse.json(
        { success: false, data: null, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const studentId = token.id as string;

    const [latest, history] = await Promise.all([
      getLatestScore(studentId),
      getScoreHistory(studentId),
    ]);

    const canRefresh = await canEvaluate(studentId);

    return NextResponse.json({
      success: true,
      data: { latest, history, canRefresh },
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/student/career-readiness]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  POST — Trigger new AI evaluation                                   */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id || token.role !== "student") {
      return NextResponse.json(
        { success: false, data: null, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const studentId = token.id as string;

    const allowed = await canEvaluate(studentId);
    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: "You can only refresh your career score once every 24 hours",
        },
        { status: 429 },
      );
    }

    const result = await calculateCareerReadiness(studentId);

    return NextResponse.json({
      success: true,
      data: result,
      error: null,
    });
  } catch (err) {
    console.error("[POST /api/student/career-readiness]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
