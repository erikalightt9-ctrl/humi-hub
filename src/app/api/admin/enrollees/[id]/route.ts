import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import {
  findEnrolleeById,
  updateEnrolleeBatch,
  updateEnrolleeNotes,
  assignEnrolleeToSchedule,
  getEnrolleeActivityLog,
  deleteEnrollee,
} from "@/lib/repositories/enrollee.repository";
import { enrolleeGeneralUpdateSchema } from "@/lib/validations/enrollee.schema";
import { assertTenantOwns, TenantMismatchError } from "@/lib/tenant-isolation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { id } = await params;
    const [enrollee, activityLog] = await Promise.all([
      findEnrolleeById(id),
      getEnrolleeActivityLog(id),
    ]);

    if (!enrollee) {
      return NextResponse.json(
        { success: false, data: null, error: "Enrollee not found" },
        { status: 404 }
      );
    }

    assertTenantOwns(enrollee.enrollment.course.tenantId, guard.tenantId);

    return NextResponse.json({
      success: true,
      data: { ...enrollee, activityLog },
      error: null,
    });
  } catch (err) {
    if (err instanceof TenantMismatchError) {
      return NextResponse.json({ success: false, data: null, error: "Forbidden" }, { status: 403 });
    }
    console.error("[GET /api/admin/enrollees/[id]]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { id } = await params;
    const body = await request.json();
    const result = enrolleeGeneralUpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, data: null, error: result.error.issues[0]?.message ?? "Invalid input" },
        { status: 422 }
      );
    }

    const existing = await findEnrolleeById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, data: null, error: "Enrollee not found" },
        { status: 404 }
      );
    }

    assertTenantOwns(existing.enrollment.course.tenantId, guard.tenantId);

    // Apply updates
    if (result.data.scheduleId !== undefined) {
      await assignEnrolleeToSchedule(id, result.data.scheduleId);
    } else if (result.data.batch !== undefined) {
      await updateEnrolleeBatch(id, result.data.batch);
    }
    if (result.data.notes !== undefined) {
      await updateEnrolleeNotes(id, result.data.notes);
    }

    const updated = await findEnrolleeById(id);

    return NextResponse.json({ success: true, data: updated, error: null });
  } catch (err) {
    if (err instanceof TenantMismatchError) {
      return NextResponse.json({ success: false, data: null, error: "Forbidden" }, { status: 403 });
    }
    console.error("[PATCH /api/admin/enrollees/[id]]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE — Admin: delete an enrollee (student) and related data      */
/* ------------------------------------------------------------------ */

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { id } = await params;

    const existing = await findEnrolleeById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, data: null, error: "Enrollee not found" },
        { status: 404 }
      );
    }

    assertTenantOwns(existing.enrollment.course.tenantId, guard.tenantId);

    await deleteEnrollee(id);

    return NextResponse.json({ success: true, data: null, error: null });
  } catch (err) {
    if (err instanceof TenantMismatchError) {
      return NextResponse.json({ success: false, data: null, error: "Forbidden" }, { status: 403 });
    }
    console.error("[DELETE /api/admin/enrollees/[id]]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
