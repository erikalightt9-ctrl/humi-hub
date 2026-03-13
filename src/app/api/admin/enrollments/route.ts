import { NextRequest, NextResponse } from "next/server";
import { listEnrollments } from "@/lib/repositories/enrollment.repository";
import type { EnrollmentFilters } from "@/types";
import type { EnrollmentStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const filters: EnrollmentFilters = {
      page: parseInt(searchParams.get("page") ?? "1", 10),
      limit: Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100),
      search: searchParams.get("search") ?? undefined,
    };

    const courseSlug = searchParams.get("courseSlug");
    if (courseSlug) filters.courseSlug = courseSlug;

    const status = searchParams.get("status");
    if (status) filters.status = status as EnrollmentStatus;

    const result = await listEnrollments(filters);

    return NextResponse.json({ success: true, data: result, error: null });
  } catch (err) {
    console.error("[GET /api/admin/enrollments]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
