import { NextRequest, NextResponse } from "next/server";
import { getTopGraduates } from "@/lib/repositories/employer-dashboard.repository";

/* ------------------------------------------------------------------ */
/*  GET  /api/public/employer-dashboard?courseSlug=medical-va           */
/*  Public — no auth required                                          */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const courseSlug =
      request.nextUrl.searchParams.get("courseSlug") ?? undefined;

    const graduates = await getTopGraduates(courseSlug);

    return NextResponse.json({
      success: true,
      data: graduates,
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/public/employer-dashboard]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
