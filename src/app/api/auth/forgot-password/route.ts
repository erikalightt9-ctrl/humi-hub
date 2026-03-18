import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requestPasswordReset } from "@/lib/services/password-reset.service";

const schema = z.object({
  email: z.string().email("Invalid email address."),
  userType: z.enum(["student", "admin", "manager"]),
  tenantId: z.string().optional(),
});

// Generic success message — never reveal if email exists
const GENERIC_OK = {
  success: true,
  data: { message: "If that email exists, a reset link has been sent." },
  error: null,
};

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

    const { email, userType, tenantId } = result.data;

    const outcome = await requestPasswordReset(email, userType, tenantId);

    if (!outcome.success) {
      // Log internally but return generic message
      console.error("[POST /api/auth/forgot-password] invalid userType");
      return NextResponse.json(GENERIC_OK);
    }

    // TODO: send email with reset link when email service is configured
    // If outcome.token is non-empty, the user exists and the token is ready
    if (outcome.token) {
      const resetLink = `${process.env.APP_URL}/reset-password?token=${outcome.token}&type=${userType}`;
      console.info("[forgot-password] reset link generated", { userType, resetLink });
      // await sendPasswordResetEmail(email, resetLink);
    }

    return NextResponse.json(GENERIC_OK);
  } catch (err) {
    console.error("[POST /api/auth/forgot-password]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
