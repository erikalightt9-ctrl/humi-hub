/**
 * GET /api/google/calendar/events?timeMin=...&timeMax=...
 *
 * Fetches events directly from Google Calendar for the current user.
 * Returns raw Google Calendar event objects.
 */
import { NextRequest, NextResponse } from "next/server";
import { getToken as getJwt } from "next-auth/jwt";
import { getToken } from "@/lib/repositories/google-token.repository";
import { listGoogleEvents } from "@/lib/services/google-calendar.service";

export async function GET(request: NextRequest) {
  try {
    const jwtToken = await getJwt({
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

    const storedToken = await getToken(userId, userRole);
    if (!storedToken) {
      return NextResponse.json(
        { success: false, data: null, error: "Google Calendar not connected" },
        { status: 400 },
      );
    }

    const { searchParams } = request.nextUrl;
    const timeMin = searchParams.get("timeMin") ?? new Date().toISOString();
    const timeMax =
      searchParams.get("timeMax") ??
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const events = await listGoogleEvents(storedToken, timeMin, timeMax);

    return NextResponse.json({ success: true, data: events, error: null });
  } catch (err) {
    console.error("[GET /api/google/calendar/events]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
