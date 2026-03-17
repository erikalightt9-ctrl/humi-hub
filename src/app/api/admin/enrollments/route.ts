import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { listEnrollments } from "@/lib/repositories/enrollment.repository";
import type { EnrollmentFilters } from "@/types";
import type { EnrollmentStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { searchParams } = request.nextUrl;

    const filters: EnrollmentFilters = {
      tenantId: guard.tenantId,
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
