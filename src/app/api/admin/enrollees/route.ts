import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { listEnrollees, getEnrolleeStats } from "@/lib/repositories/enrollee.repository";
import type { EnrolleeFilters } from "@/types";
import type { StudentPaymentStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(request.url);

    const filters: EnrolleeFilters = {
      tenantId: guard.tenantId,
      page: parseInt(searchParams.get("page") ?? "1", 10),
      limit: parseInt(searchParams.get("limit") ?? "20", 10),
      search: searchParams.get("search") ?? undefined,
      courseSlug: searchParams.get("courseSlug") ?? undefined,
      paymentStatus: (searchParams.get("paymentStatus") as StudentPaymentStatus) ?? undefined,
      batch: searchParams.get("batch") ?? undefined,
    };

    const accessParam = searchParams.get("accessGranted");
    if (accessParam === "true") filters.accessGranted = true;
    if (accessParam === "false") filters.accessGranted = false;

    const [enrollees, stats] = await Promise.all([
      listEnrollees(filters),
      getEnrolleeStats(guard.tenantId),
    ]);

    return NextResponse.json({
      success: true,
      data: { ...enrollees, stats },
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/admin/enrollees]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
