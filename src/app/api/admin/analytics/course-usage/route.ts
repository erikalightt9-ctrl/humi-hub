import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import {
  getLatestSnapshotsForTenant,
  getCourseUsageHistory,
  snapshotAllCourses,
} from "@/lib/repositories/course-usage-snapshot.repository";

/* ------------------------------------------------------------------ */
/*  GET — dashboard table (all courses) OR history chart (one course) */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");
    const days = searchParams.get("days") ? Number(searchParams.get("days")) : 30;

    if (courseId) {
      // Per-course time-series for charts
      const history = await getCourseUsageHistory(courseId, days);
      return NextResponse.json({ success: true, data: history, error: null });
    }

    // Dashboard table: latest snapshot per course
    const snapshots = await getLatestSnapshotsForTenant(guard.tenantId);
    return NextResponse.json({ success: true, data: snapshots, error: null });
  } catch (err) {
    console.error("[GET /api/admin/analytics/course-usage]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/*  POST — manually trigger a snapshot (superadmin or cron endpoint)  */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const result = await snapshotAllCourses(guard.tenantId);
    return NextResponse.json({ success: true, data: result, error: null });
  } catch (err) {
    console.error("[POST /api/admin/analytics/course-usage]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
