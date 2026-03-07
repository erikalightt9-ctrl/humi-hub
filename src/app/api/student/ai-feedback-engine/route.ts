import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getAggregatedFeedback } from "@/lib/repositories/feedback-engine.repository";
import { generateFullAssessment } from "@/lib/services/ai-feedback-engine.service";
import { fullAssessmentSchema } from "@/lib/validations/ai-feedback-engine.schema";

/* ------------------------------------------------------------------ */
/*  GET -- Aggregated feedback dashboard data                          */
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
    const data = await getAggregatedFeedback(studentId);

    return NextResponse.json({
      success: true,
      data,
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/student/ai-feedback-engine]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  POST -- Generate full AI assessment                                */
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
    const body = await request.json();

    const parsed = fullAssessmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, data: null, error: "Invalid request" },
        { status: 400 },
      );
    }

    const assessment = await generateFullAssessment(studentId);

    return NextResponse.json({
      success: true,
      data: assessment,
      error: null,
    });
  } catch (err) {
    console.error("[POST /api/student/ai-feedback-engine]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
