/**
 * DELETE /api/google/calendar/disconnect
 *
 * Removes the stored Google Calendar tokens for the current user.
 * After this, the user's events will no longer sync to Google.
 */
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { deleteToken } from "@/lib/repositories/google-token.repository";

export async function DELETE(request: NextRequest) {
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

    await deleteToken(userId, userRole);

    return NextResponse.json({
      success: true,
      data: { connected: false },
      error: null,
    });
  } catch (err) {
    console.error("[DELETE /api/google/calendar/disconnect]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
