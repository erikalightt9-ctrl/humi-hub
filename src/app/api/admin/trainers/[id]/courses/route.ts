import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import {
  getTrainerById,
  assignTrainerToCourse,
  removeTrainerFromCourse,
} from "@/lib/repositories/trainer.repository";
import {
  assignTrainerSchema,
  unassignTrainerSchema,
} from "@/lib/validations/trainer.schema";

/* ------------------------------------------------------------------ */
/*  POST — Admin: assign trainer to a course                           */
/* ------------------------------------------------------------------ */

export async function POST(
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

    const body = await request.json();
    const parsed = assignTrainerSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message ?? "Invalid input";
      return NextResponse.json(
        { success: false, data: null, error: firstIssue },
        { status: 422 },
      );
    }

    const assignment = await assignTrainerToCourse(
      id,
      parsed.data.courseId,
      parsed.data.role,
    );

    return NextResponse.json(
      { success: true, data: assignment, error: null },
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
          error: "Trainer is already assigned to this course",
        },
        { status: 409 },
      );
    }

    console.error("[POST /api/admin/trainers/[id]/courses]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE — Admin: remove trainer from a course                       */
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

    const trainer = await getTrainerById(id);
    if (!trainer) {
      return NextResponse.json(
        { success: false, data: null, error: "Trainer not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const parsed = unassignTrainerSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message ?? "Invalid input";
      return NextResponse.json(
        { success: false, data: null, error: firstIssue },
        { status: 422 },
      );
    }

    await removeTrainerFromCourse(id, parsed.data.courseId);

    return NextResponse.json({
      success: true,
      data: null,
      error: null,
    });
  } catch (err) {
    console.error("[DELETE /api/admin/trainers/[id]/courses]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
