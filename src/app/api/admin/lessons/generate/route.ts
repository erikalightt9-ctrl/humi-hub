import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  generateLessonsForTier,
  generateLessonsForAllTiers,
} from "@/lib/services/ai-lesson-generator.service";

// Allow up to 60s for AI generation (especially "All Tiers" = 3 API calls)
export const maxDuration = 60;

const generateSchema = z.object({
  courseId: z.string().min(1),
  tier: z.enum(["BASIC", "PROFESSIONAL", "ADVANCED", "ALL"]),
});

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id || token.role !== "admin") {
      return NextResponse.json(
        { success: false, data: null, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const result = generateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, data: null, error: "Invalid input: courseId and tier are required" },
        { status: 422 },
      );
    }

    const { courseId, tier } = result.data;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true, description: true },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, data: null, error: "Course not found" },
        { status: 404 },
      );
    }

    if (tier === "ALL") {
      const results = await generateLessonsForAllTiers(
        course.id,
        course.title,
        course.description,
      );
      const totalCreated = results.reduce((sum, r) => sum + r.lessonsCreated, 0);
      return NextResponse.json(
        {
          success: true,
          data: { tiers: results, totalLessonsCreated: totalCreated },
          error: null,
        },
        { status: 201 },
      );
    }

    const output = await generateLessonsForTier({
      courseId: course.id,
      courseTitle: course.title,
      courseDescription: course.description,
      tier,
    });

    return NextResponse.json(
      {
        success: true,
        data: { tiers: [output], totalLessonsCreated: output.lessonsCreated },
        error: null,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/admin/lessons/generate]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { success: false, data: null, error: message },
      { status: 500 },
    );
  }
}
