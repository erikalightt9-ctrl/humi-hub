import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  createJobPosting,
  getJobPostings,
} from "@/lib/repositories/job-matching.repository";
import { createJobPostingSchema } from "@/lib/validations/ai-job-matching.schema";
import type { CourseSlug } from "@/types";

/* ------------------------------------------------------------------ */
/*  GET — List all job postings (with optional filters)                */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id || token.role !== "admin") {
      return NextResponse.json(
        { success: false, data: null, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const isActiveParam = searchParams.get("isActive");
    const courseSlugParam = searchParams.get("courseSlug");

    const filters: { isActive?: boolean; courseSlug?: CourseSlug } = {};

    if (isActiveParam === "true") filters.isActive = true;
    if (isActiveParam === "false") filters.isActive = false;
    if (courseSlugParam) filters.courseSlug = courseSlugParam;

    const postings = await getJobPostings(filters);

    return NextResponse.json({
      success: true,
      data: postings,
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/admin/job-postings]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  POST — Create a new job posting                                    */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id || token.role !== "admin") {
      return NextResponse.json(
        { success: false, data: null, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const parsed = createJobPostingSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message ?? "Invalid input";
      return NextResponse.json(
        { success: false, data: null, error: firstIssue },
        { status: 400 },
      );
    }

    const posting = await createJobPosting(parsed.data);

    return NextResponse.json(
      { success: true, data: posting, error: null },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/admin/job-postings]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
