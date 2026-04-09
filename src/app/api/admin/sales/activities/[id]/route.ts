import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { deleteActivity } from "@/lib/repositories/crm.repository";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    await deleteActivity(guard.tenantId, (await params).id);

    return NextResponse.json({ success: true, data: null, error: null });
  } catch (err) {
    console.error("[DELETE /api/admin/sales/activities/[id]]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    const status  = message === "Activity not found" ? 404 : 500;
    return NextResponse.json({ success: false, data: null, error: message }, { status });
  }
}
