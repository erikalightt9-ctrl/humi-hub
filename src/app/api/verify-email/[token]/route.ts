import { NextRequest, NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/services/verification.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  try {
    const result = await verifyEmailToken(token);

    if (result.success) {
      return NextResponse.redirect(
        `${baseUrl}/verify-email?success=true&enrollmentId=${result.enrollmentId}`
      );
    }

    return NextResponse.redirect(
      `${baseUrl}/verify-email?error=${result.error}`
    );
  } catch (err) {
    console.error("[GET /api/verify-email/[token]]", err);
    return NextResponse.redirect(`${baseUrl}/verify-email?error=server_error`);
  }
}
