import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import {
  approveSubscription,
  rejectSubscription,
} from "@/lib/repositories/subscription.repository";
import { adminSubscriptionActionSchema } from "@/lib/validations/subscription.schema";

/* ------------------------------------------------------------------ */
/*  PATCH — Approve or reject a subscription (admin)                   */
/* ------------------------------------------------------------------ */

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { id } = await params;
    const body = await request.json();

    const parsed = adminSubscriptionActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, data: null, error: "Invalid action" },
        { status: 422 },
      );
    }

    const adminId = token!.id as string;

    if (parsed.data.action === "approve") {
      const updated = await approveSubscription(id, adminId);
      return NextResponse.json({
        success: true,
        data: {
          id: updated.id,
          status: updated.status,
          startDate: updated.startDate?.toISOString() ?? null,
          endDate: updated.endDate?.toISOString() ?? null,
        },
        error: null,
      });
    }

    // reject
    const updated = await rejectSubscription(id);
    return NextResponse.json({
      success: true,
      data: { id: updated.id, status: updated.status },
      error: null,
    });
  } catch (err) {
    console.error("[PATCH /api/admin/subscriptions/[id]]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
