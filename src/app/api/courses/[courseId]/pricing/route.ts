import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeTierFinalPrices } from "@/lib/repositories/course.repository";

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
        discountBasic: true,
        discountProfessional: true,
        discountAdvanced: true,
      },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, data: null, error: "Course not found" },
        { status: 404 },
      );
    }

    const prices = computeTierFinalPrices(course);

    return NextResponse.json({
      success: true,
      data: {
        ...prices,
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
