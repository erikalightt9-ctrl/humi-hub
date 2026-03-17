import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import {
  getTestimonialById,
  updateTestimonial,
  deleteTestimonial,
} from "@/lib/repositories/testimonial.repository";
import { updateTestimonialSchema } from "@/lib/validations/testimonial.schema";

/* ------------------------------------------------------------------ */
/*  PATCH — Admin: update a testimonial                                */
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

    const existing = await getTestimonialById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, data: null, error: "Testimonial not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const parsed = updateTestimonialSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message ?? "Invalid input";
      return NextResponse.json(
        { success: false, data: null, error: firstIssue },
        { status: 422 },
      );
    }

    const updated = await updateTestimonial(id, parsed.data);

    return NextResponse.json({
      success: true,
      data: updated,
      error: null,
    });
  } catch (err) {
    console.error("[PATCH /api/admin/testimonials/[id]]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE — Admin: remove a testimonial                               */
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

    const existing = await getTestimonialById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, data: null, error: "Testimonial not found" },
        { status: 404 },
      );
    }

    await deleteTestimonial(id);

    return NextResponse.json({
      success: true,
      data: null,
      error: null,
    });
  } catch (err) {
    console.error("[DELETE /api/admin/testimonials/[id]]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
