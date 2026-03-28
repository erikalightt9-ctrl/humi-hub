/**
 * GET /api/auth/google
 *
 * Initiates the Google OAuth2 flow.
 * Requires the user to be authenticated (any role).
 * Encodes userId + userRole in the OAuth `state` param so
 * the callback can identify which user is connecting.
 */
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getAuthUrl, createOAuthClient } from "@/lib/services/google-calendar.service";

export async function GET(request: NextRequest) {
  try {
    const jwtToken = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!jwtToken?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const userId = jwtToken.id as string;
    const userRole = (jwtToken.role as string) ?? "admin";

    // Encode state as base64 JSON so we can recover it in the callback
    const state = Buffer.from(JSON.stringify({ userId, userRole })).toString(
      "base64url",
    );

    const oauth2 = createOAuthClient();
    const url = oauth2.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: ["https://www.googleapis.com/auth/calendar"],
      state,
    });

    // Redirect the browser to Google's consent screen
    return NextResponse.redirect(url);
  } catch (err) {
    console.error("[GET /api/auth/google]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
