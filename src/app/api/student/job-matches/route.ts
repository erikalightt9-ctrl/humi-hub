import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getStudentMatches } from "@/lib/repositories/job-matching.repository";
import {
  matchStudentToJobs,
  canRunMatching,
} from "@/lib/services/ai-job-matching.service";

/* ------------------------------------------------------------------ */
/*  GET — Return student's existing matches                            */
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

    const [matches, canRefresh] = await Promise.all([
      getStudentMatches(studentId),
      canRunMatching(studentId),
    ]);

    return NextResponse.json({
      success: true,
      data: { matches, canRefresh },
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/student/job-matches]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  POST — Trigger new AI matching run (rate-limited: 1 per 24h)       */
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

    const allowed = await canRunMatching(studentId);
    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error:
            "You can only run job matching once every 24 hours. Please try again later.",
        },
        { status: 429 },
      );
    }

    const matches = await matchStudentToJobs(studentId);

    return NextResponse.json({
      success: true,
      data: { matches, canRefresh: false },
      error: null,
    });
  } catch (err) {
    console.error("[POST /api/student/job-matches]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
