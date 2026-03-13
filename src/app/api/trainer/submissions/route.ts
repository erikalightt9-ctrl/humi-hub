import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getPendingSubmissionsForTrainer } from "@/lib/repositories/trainer.repository";

/* ------------------------------------------------------------------ */
/*  GET — Trainer: pending submissions from assigned students          */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id || token.role !== "trainer") {
      return NextResponse.json(
        { success: false, data: null, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const trainerId = token.id as string;
    const submissions = await getPendingSubmissionsForTrainer(trainerId);

    return NextResponse.json({
      success: true,
      data: submissions,
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/trainer/submissions]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
