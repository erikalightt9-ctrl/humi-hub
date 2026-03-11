import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { grantAccessSchema } from "@/lib/validations/trainer.schema";
import { getTrainerById } from "@/lib/repositories/trainer.repository";
import {
  grantTrainerAccess,
  revokeTrainerAccess,
  resetTrainerPassword,
} from "@/lib/services/trainer-auth.service";
import {
  sendTrainerCredentialsEmail,
  sendTrainerPasswordResetEmail,
} from "@/lib/email/send-trainer-credentials";

/* ------------------------------------------------------------------ */
/*  POST — Admin: manage trainer portal access                          */
/*  Actions: "grant" | "revoke" | "reset-password"                      */
/* ------------------------------------------------------------------ */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id || token.role !== "admin") {
      return NextResponse.json(
        { success: false, data: null, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id: trainerId } = await params;

    const trainer = await getTrainerById(trainerId);
    if (!trainer) {
      return NextResponse.json(
        { success: false, data: null, error: "Trainer not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const parsed = grantAccessSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message ?? "Invalid input";
      return NextResponse.json(
        { success: false, data: null, error: firstIssue },
        { status: 422 },
      );
    }

    const { action } = parsed.data;

    switch (action) {
      case "grant": {
        const result = await grantTrainerAccess(trainerId);

        // Send credentials email to trainer (fire-and-forget)
        sendTrainerCredentialsEmail({
          name: trainer.name,
          email: trainer.email,
          temporaryPassword: result.temporaryPassword,
        }).catch((emailErr) => {
          console.error("[Grant Access] Failed to send email:", emailErr);
        });

        return NextResponse.json({
          success: true,
          data: { temporaryPassword: result.temporaryPassword },
          error: null,
        });
      }

      case "revoke": {
        await revokeTrainerAccess(trainerId);
        return NextResponse.json({
          success: true,
          data: null,
          error: null,
        });
      }

      case "reset-password": {
        const result = await resetTrainerPassword(trainerId);

        // Send password reset email to trainer (fire-and-forget)
        sendTrainerPasswordResetEmail({
          name: trainer.name,
          email: trainer.email,
          temporaryPassword: result.temporaryPassword,
        }).catch((emailErr) => {
          console.error("[Reset Password] Failed to send email:", emailErr);
        });

        return NextResponse.json({
          success: true,
          data: { temporaryPassword: result.temporaryPassword },
          error: null,
        });
      }

      default: {
        return NextResponse.json(
          { success: false, data: null, error: "Unknown action" },
          { status: 422 },
        );
      }
    }
  } catch (err) {
    console.error("[POST /api/admin/trainers/[id]/access]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
