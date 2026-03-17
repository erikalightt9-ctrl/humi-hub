import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import {
  getTrainerById,
  updateTrainer,
  deleteTrainer,
} from "@/lib/repositories/trainer.repository";
import { updateTrainerSchema } from "@/lib/validations/trainer.schema";

/* ------------------------------------------------------------------ */
/*  GET — Admin: get trainer with courses                              */
/* ------------------------------------------------------------------ */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { id } = await params;
    const trainer = await getTrainerById(id);

    if (!trainer) {
      return NextResponse.json(
        { success: false, data: null, error: "Trainer not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: trainer,
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/admin/trainers/[id]]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  PATCH — Admin: update trainer                                      */
/* ------------------------------------------------------------------ */

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { id } = await params;

    const existing = await getTrainerById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, data: null, error: "Trainer not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const parsed = updateTrainerSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message ?? "Invalid input";
      return NextResponse.json(
        { success: false, data: null, error: firstIssue },
        { status: 422 },
      );
    }

    const updated = await updateTrainer(id, parsed.data);

    return NextResponse.json({
      success: true,
      data: updated,
      error: null,
    });
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

    console.error("[PATCH /api/admin/trainers/[id]]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE — Admin: soft-delete trainer (set isActive = false)          */
/* ------------------------------------------------------------------ */

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { id } = await params;

    const existing = await getTrainerById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, data: null, error: "Trainer not found" },
        { status: 404 },
      );
    }

    await deleteTrainer(id);

    return NextResponse.json({
      success: true,
      data: null,
      error: null,
    });
  } catch (err) {
    console.error("[DELETE /api/admin/trainers/[id]]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
