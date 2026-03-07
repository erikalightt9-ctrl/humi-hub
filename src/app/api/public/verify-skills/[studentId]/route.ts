import { NextRequest, NextResponse } from "next/server";
import { getPublicVerifiedSkills } from "@/lib/repositories/skill-verification.repository";

/* ------------------------------------------------------------------ */
/*  GET — Return public verified skills for a student (no auth)        */
/* ------------------------------------------------------------------ */

interface RouteContext {
  readonly params: Promise<{ studentId: string }>;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { studentId } = await context.params;

    if (!studentId || typeof studentId !== "string") {
      return NextResponse.json(
        { success: false, data: null, error: "Student ID is required" },
        { status: 400 },
      );
    }

    const data = await getPublicVerifiedSkills(studentId);

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: "Student not found or portfolio is not public",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data,
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/public/verify-skills]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
