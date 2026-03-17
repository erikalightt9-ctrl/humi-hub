import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import {
  getAllTestimonials,
  createTestimonial,
} from "@/lib/repositories/testimonial.repository";
import { createTestimonialSchema } from "@/lib/validations/testimonial.schema";

/* ------------------------------------------------------------------ */
/*  GET — Admin: list all testimonials                                 */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const testimonials = await getAllTestimonials();

    return NextResponse.json({
      success: true,
      data: testimonials,
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/admin/testimonials]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  POST — Admin: create a testimonial                                 */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const body = await request.json();
    const parsed = createTestimonialSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message ?? "Invalid input";
      return NextResponse.json(
        { success: false, data: null, error: firstIssue },
        { status: 422 },
      );
    }

    const testimonial = await createTestimonial(parsed.data);

    return NextResponse.json(
      { success: true, data: testimonial, error: null },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/admin/testimonials]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
