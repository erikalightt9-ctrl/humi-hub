/**
 * GET /api/google/calendar/status
 *
 * Returns whether the current user has connected Google Calendar.
 * Response: { success: true, data: { connected: boolean } }
 */
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { hasToken } from "@/lib/repositories/google-token.repository";

export async function GET(request: NextRequest) {
  try {
    const jwtToken = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!jwtToken?.id) {
      return NextResponse.json(
        { success: false, data: null, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const userId   = jwtToken.id as string;
    const userRole = (jwtToken.role as string) ?? "admin";

    const connected = await hasToken(userId, userRole);

    return NextResponse.json({
      success: true,
      data: { connected },
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/google/calendar/status]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
