import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  getAllCoursesByTenant,
  createCourse,
} from "@/lib/repositories/course.repository";
import { requireAdmin } from "@/lib/auth-guards";
import { createCourseSchema } from "@/lib/validations/course.schema";

/* ------------------------------------------------------------------ */
/*  GET — Admin: list courses scoped to tenant                         */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const courses = await getAllCoursesByTenant(guard.tenantId);
    return NextResponse.json({ success: true, data: courses, error: null });
  } catch (err) {
    console.error("[GET /api/admin/courses]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  POST — Admin: create a course                                      */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const body = await request.json();
    const parsed = createCourseSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message ?? "Invalid input";
      return NextResponse.json(
        { success: false, data: null, error: firstIssue },
        { status: 422 },
      );
    }

    const course = await createCourse({ ...parsed.data, tenantId: guard.tenantId });

    return NextResponse.json({ success: true, data: course, error: null }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/courses]", err);
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
