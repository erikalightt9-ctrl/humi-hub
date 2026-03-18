import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resetPassword } from "@/lib/services/password-reset.service";

const schema = z.object({
  token: z.string().min(1, "Token is required."),
  newPassword: z.string().min(8, "Password must be at least 8 characters.").max(128),
  userType: z.enum(["student", "admin", "manager"]),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, data: null, error: result.error.issues[0].message },
        { status: 422 },
      );
    }

    const { token, newPassword, userType } = result.data;
    const outcome = await resetPassword(token, newPassword, userType);

    if (!outcome.success) {
      return NextResponse.json(
        { success: false, data: null, error: outcome.error },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: "Password has been reset successfully." },
      error: null,
    });
  } catch (err) {
    console.error("[POST /api/auth/reset-password]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
