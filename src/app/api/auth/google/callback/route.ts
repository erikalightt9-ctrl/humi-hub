/**
 * GET /api/auth/google/callback
 *
 * Google redirects here after the user grants consent.
 * Exchanges the auth code for tokens, stores them, then
 * redirects back to /admin/calendar?google=connected.
 */
import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForTokens,
} from "@/lib/services/google-calendar.service";
import { upsertToken } from "@/lib/repositories/google-token.repository";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code  = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // User denied access
  if (error) {
    console.warn("[Google callback] user denied access:", error);
    return NextResponse.redirect(
      new URL("/admin/calendar?google=denied", request.url),
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/admin/calendar?google=error", request.url),
    );
  }

  try {
    // Decode state → { userId, userRole }
    const decoded = JSON.parse(
      Buffer.from(state, "base64url").toString("utf8"),
    ) as { userId: string; userRole: string };

    const { userId, userRole } = decoded;

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Persist tokens
    await upsertToken(userId, userRole, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: tokens.tokenType,
      expiresAt: tokens.expiresAt,
    });

    // Redirect back to the calendar with success flag
    return NextResponse.redirect(
      new URL("/admin/calendar?google=connected", request.url),
    );
  } catch (err) {
    console.error("[GET /api/auth/google/callback]", err);
    return NextResponse.redirect(
      new URL("/admin/calendar?google=error", request.url),
    );
  }
}
