import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { getInsights } from "@/lib/services/ai-admin-insights.service";

/* ------------------------------------------------------------------ */
/*  GET — Return cached or fresh insights                              */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const insights = await getInsights(false);

    return NextResponse.json({
      success: true,
      data: insights,
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/admin/ai-insights]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  POST — Force-refresh insights                                      */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const insights = await getInsights(true);

    return NextResponse.json({
      success: true,
      data: insights,
      error: null,
    });
  } catch (err) {
    console.error("[POST /api/admin/ai-insights]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
