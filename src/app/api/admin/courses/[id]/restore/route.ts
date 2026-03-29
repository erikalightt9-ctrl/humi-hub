import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { getCourseById, restoreCourse } from "@/lib/repositories/course.repository";
import { assertTenantOwns, TenantMismatchError } from "@/lib/tenant-isolation";

/* ------------------------------------------------------------------ */
/*  POST — Admin: restore a soft-deleted course                        */
/* ------------------------------------------------------------------ */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { id } = await params;

    const existing = await getCourseById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, data: null, error: "Course not found" },
        { status: 404 },
      );
    }

    assertTenantOwns(existing.tenantId, guard.tenantId);

    const restored = await restoreCourse(id);

    return NextResponse.json({ success: true, data: restored, error: null });
  } catch (err) {
    if (err instanceof TenantMismatchError) {
      return NextResponse.json({ success: false, data: null, error: "Forbidden" }, { status: 403 });
    }
    console.error("[POST /api/admin/courses/[id]/restore]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
