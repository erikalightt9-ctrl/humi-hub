import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Always read live pricing from DB — never serve a cached response
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        priceBasic: true,
        priceProfessional: true,
        priceAdvanced: true,
        featuresBasic: true,
        featuresProfessional: true,
        featuresAdvanced: true,
        popularTier: true,
      },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, data: null, error: "Course not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        priceBasic: Number(course.priceBasic),
        priceProfessional: Number(course.priceProfessional),
        priceAdvanced: Number(course.priceAdvanced),
        featuresBasic: course.featuresBasic,
        featuresProfessional: course.featuresProfessional,
        featuresAdvanced: course.featuresAdvanced,
        popularTier: course.popularTier ?? null,
      },
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/courses/[courseId]/pricing]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
