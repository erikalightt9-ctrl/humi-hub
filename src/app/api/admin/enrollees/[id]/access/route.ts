import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { findEnrolleeById, updateEnrolleeAccess } from "@/lib/repositories/enrollee.repository";
import { accessUpdateSchema } from "@/lib/validations/enrollee.schema";

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
    const result = accessUpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, data: null, error: result.error.issues[0]?.message ?? "Invalid input" },
        { status: 422 }
      );
    }

    const enrollee = await findEnrolleeById(id);
    if (!enrollee) {
      return NextResponse.json(
        { success: false, data: null, error: "Enrollee not found" },
        { status: 404 }
      );
    }

    const updated = await updateEnrolleeAccess(
      id,
      result.data.accessGranted,
      result.data.accessExpiry
    );

    return NextResponse.json({ success: true, data: updated, error: null });
  } catch (err) {
    console.error("[PATCH /api/admin/enrollees/[id]/access]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
