import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { getCourseById, getCoursePriceHistory } from "@/lib/repositories/course.repository";
import { assertTenantOwns, TenantMismatchError } from "@/lib/tenant-isolation";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { id } = await params;

    const course = await getCourseById(id);
    if (!course) {
      return NextResponse.json(
        { success: false, data: null, error: "Course not found" },
        { status: 404 },
      );
    }

    assertTenantOwns(course.tenantId, guard.tenantId);

    const history = await getCoursePriceHistory(id);

    // Serialize Decimal fields to numbers
    const serialized = history.map((h) => ({
      id: h.id,
      courseId: h.courseId,
      tier: h.tier,
      oldPrice: Number(h.oldPrice),
      newPrice: Number(h.newPrice),
      updatedAt: h.updatedAt.toISOString(),
    }));

    return NextResponse.json({ success: true, data: serialized, error: null });
  } catch (err) {
    if (err instanceof TenantMismatchError) {
      return NextResponse.json(
        { success: false, data: null, error: "Forbidden" },
        { status: 403 },
      );
    }
    console.error("[GET /api/admin/courses/[id]/price-history]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
