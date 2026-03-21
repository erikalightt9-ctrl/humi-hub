import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const PAGE_SIZE = 10;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim() ?? "";
    const type = searchParams.get("type")?.trim() ?? "";
    const industry = searchParams.get("industry")?.trim() ?? "";
    const pageParam = searchParams.get("page");
    const page = pageParam && Number(pageParam) > 0 ? Number(pageParam) : 1;

    const where: Prisma.JobPostingWhereInput = { isActive: true };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (type) {
      where.type = { equals: type, mode: "insensitive" };
    }

    if (industry) {
      where.industry = { equals: industry, mode: "insensitive" };
    }

    const [total, jobs] = await Promise.all([
      prisma.jobPosting.count({ where }),
      prisma.jobPosting.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: jobs,
      error: null,
      meta: {
        total,
        page,
        limit: PAGE_SIZE,
        totalPages: Math.ceil(total / PAGE_SIZE),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch job postings";
    return NextResponse.json(
      { success: false, data: null, error: message },
      { status: 500 }
    );
  }
}
