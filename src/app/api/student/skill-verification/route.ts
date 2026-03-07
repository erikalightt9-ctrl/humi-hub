import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getVerifiedSkills } from "@/lib/repositories/skill-verification.repository";
import {
  verifyStudentSkills,
  canRefreshSkills,
  getHoursUntilRefresh,
} from "@/lib/services/skill-verification.service";

/* ------------------------------------------------------------------ */
/*  GET — Return current verified skills + canRefresh flag             */
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

    const [skills, canRefresh, hoursUntilRefresh] = await Promise.all([
      getVerifiedSkills(studentId),
      canRefreshSkills(studentId),
      getHoursUntilRefresh(studentId),
    ]);

    return NextResponse.json({
      success: true,
      data: { skills, canRefresh, hoursUntilRefresh },
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/student/skill-verification]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  POST — Trigger skill refresh (rate limited 24hr)                   */
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

    const allowed = await canRefreshSkills(studentId);
    if (!allowed) {
      const hours = await getHoursUntilRefresh(studentId);
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: `Skills can only be refreshed once every 24 hours. Available in ${hours} hour${hours !== 1 ? "s" : ""}.`,
        },
        { status: 429 },
      );
    }

    const skills = await verifyStudentSkills(studentId);

    return NextResponse.json({
      success: true,
      data: { skills, canRefresh: false, hoursUntilRefresh: 24 },
      error: null,
    });
  } catch (err) {
    console.error("[POST /api/student/skill-verification]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
