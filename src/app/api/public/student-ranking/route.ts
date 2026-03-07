import { NextRequest, NextResponse } from "next/server";
import { getPublicRanking } from "@/lib/repositories/student-ranking.repository";

/* ------------------------------------------------------------------ */
/*  GET  /api/public/student-ranking?courseSlug=medical-va              */
/*  Public — no auth required. Returns anonymized top 20.              */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const courseSlug =
      request.nextUrl.searchParams.get("courseSlug") ?? undefined;

    const ranking = await getPublicRanking(courseSlug);

    return NextResponse.json({
      success: true,
      data: ranking,
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/public/student-ranking]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
