import { NextResponse } from "next/server";
import { getPublishedTestimonials } from "@/lib/repositories/testimonial.repository";

/* ------------------------------------------------------------------ */
/*  GET — Public: list published testimonials                          */
/* ------------------------------------------------------------------ */

export async function GET() {
  try {
    const testimonials = await getPublishedTestimonials();

    return NextResponse.json({
      success: true,
      data: testimonials,
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/testimonials]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
