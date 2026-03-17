import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import {
  getCourseById,
  updateCourse,
  deleteCourse,
} from "@/lib/repositories/course.repository";
import { updateCourseSchema } from "@/lib/validations/course.schema";

/* ------------------------------------------------------------------ */
/*  GET — Admin: fetch a single course with full details               */
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

    const course = await getCourseById(id);
    if (!course) {
      return NextResponse.json(
        { success: false, data: null, error: "Course not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: course,
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/admin/courses/[id]]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  PATCH — Admin: update a course                                     */
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

    const existing = await getCourseById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, data: null, error: "Course not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const parsed = updateCourseSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message ?? "Invalid input";
      return NextResponse.json(
        { success: false, data: null, error: firstIssue },
        { status: 422 },
      );
    }

    const updated = await updateCourse(id, parsed.data);

    return NextResponse.json({
      success: true,
      data: updated,
      error: null,
    });
  } catch (err) {
    console.error("[PATCH /api/admin/courses/[id]]", err);

    const message =
      err instanceof Error && err.message.includes("Unique constraint")
        ? "A course with this slug already exists"
        : "Internal server error";

    return NextResponse.json(
      { success: false, data: null, error: message },
      { status: message === "Internal server error" ? 500 : 409 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE — Admin: soft-delete a course (set isActive=false)          */
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

    const existing = await getCourseById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, data: null, error: "Course not found" },
        { status: 404 },
      );
    }

    await deleteCourse(id);

    return NextResponse.json({
      success: true,
      data: null,
      error: null,
    });
  } catch (err) {
    console.error("[DELETE /api/admin/courses/[id]]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
