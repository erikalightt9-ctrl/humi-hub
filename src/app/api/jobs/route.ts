import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { CourseSlug, Prisma } from "@prisma/client";

const COURSE_SLUGS = ["MEDICAL_VA", "REAL_ESTATE_VA", "US_BOOKKEEPING_VA"] as const;

const jobSearchSchema = z.object({
  search: z.string().max(200).optional(),
  courseSlug: z.enum(COURSE_SLUGS).optional(),
  type: z.string().max(50).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const rawParams = {
      search: url.searchParams.get("search") ?? undefined,
      courseSlug: url.searchParams.get("courseSlug") ?? undefined,
      type: url.searchParams.get("type") ?? undefined,
    };

    const parsed = jobSearchSchema.safeParse(rawParams);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, data: null, error: "Invalid query parameters" },
        { status: 400 },
      );
    }

    const { search, courseSlug, type } = parsed.data;

    const where: Prisma.JobPostingWhereInput = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (courseSlug) {
      where.courseSlug = courseSlug as CourseSlug;
    }

    if (type) {
      where.type = type;
    }

    const jobs = await prisma.jobPosting.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        company: true,
        description: true,
        requirements: true,
        skills: true,
        courseSlug: true,
        location: true,
        type: true,
        salaryRange: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, data: jobs, error: null });
  } catch (err) {
    console.error("[GET /api/jobs]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
