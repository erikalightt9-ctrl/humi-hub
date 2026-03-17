import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { getAdminRanking } from "@/lib/repositories/student-ranking.repository";

/* ------------------------------------------------------------------ */
/*  GET  /api/admin/student-ranking?courseSlug=medical-va               */
/*  Admin only — returns full details for all students.                */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const guard = requireAdmin(token);
  if (!guard.ok) return guard.response;

  try {
    const courseSlug =
      request.nextUrl.searchParams.get("courseSlug") ?? undefined;

    const ranking = await getAdminRanking(courseSlug);

    return NextResponse.json({
      success: true,
      data: ranking,
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/admin/student-ranking]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
