import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import {
  getAllTrainersByTenant,
  createTrainer,
} from "@/lib/repositories/trainer.repository";
import { createTrainerSchema } from "@/lib/validations/trainer.schema";

/* ------------------------------------------------------------------ */
/*  GET — Admin: list all trainers with course count                   */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const trainers = await getAllTrainersByTenant(guard.tenantId);

    return NextResponse.json({
      success: true,
      data: trainers,
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/admin/trainers]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  POST — Admin: create a trainer                                     */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const body = await request.json();
    const parsed = createTrainerSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message ?? "Invalid input";
      return NextResponse.json(
        { success: false, data: null, error: firstIssue },
        { status: 422 },
      );
    }

    const trainer = await createTrainer(parsed.data);

    return NextResponse.json(
      { success: true, data: trainer, error: null },
      { status: 201 },
    );
  } catch (err) {
    const isPrismaUniqueError =
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2002";

    if (isPrismaUniqueError) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: "A trainer with this email already exists",
        },
        { status: 409 },
      );
    }

    console.error("[POST /api/admin/trainers]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
