import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  calculateMetrics,
  analyzeWorkPace,
  canAnalyze,
} from "@/lib/services/ai-work-pace.service";

/* ------------------------------------------------------------------ */
/*  GET — Return metrics (lightweight, no AI)                          */
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

    const { courseContext, ...metrics } = await calculateMetrics(studentId);
    const canRefresh = canAnalyze(studentId);

    return NextResponse.json({
      success: true,
      data: { metrics, courseContext, canRefresh },
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/student/work-pace]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  POST — Trigger full AI analysis (rate-limited: 1 per 6 hours)     */
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

    const allowed = canAnalyze(studentId);
    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error:
            "You can only request an AI pace analysis once every 6 hours",
        },
        { status: 429 },
      );
    }

    const result = await analyzeWorkPace(studentId);

    return NextResponse.json({
      success: true,
      data: result,
      error: null,
    });
  } catch (err) {
    console.error("[POST /api/student/work-pace]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
