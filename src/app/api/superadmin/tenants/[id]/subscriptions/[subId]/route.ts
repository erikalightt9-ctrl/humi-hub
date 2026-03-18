import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth-guards";
import {
  getTenantSubscriptionById,
  confirmTenantPayment,
  updateTenantSubscriptionStatus,
  syncTenantPlanCache,
} from "@/lib/repositories/tenant-subscription.repository";

const patchSubscriptionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("confirm_payment"),
    paymentRef: z.string().max(200).optional(),
    paymentMethod: z.string().max(100).optional(),
  }),
  z.object({
    action: z.literal("set_status"),
    status: z.enum(["PENDING", "ACTIVE", "PAST_DUE", "EXPIRED", "CANCELLED"]),
  }),
]);

/* ------------------------------------------------------------------ */
/*  GET — Single subscription                                         */
/* ------------------------------------------------------------------ */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subId: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireSuperAdmin(token);
    if (!guard.ok) return guard.response;

    const { subId } = await params;
    const subscription = await getTenantSubscriptionById(subId);
    if (!subscription) {
      return NextResponse.json({ success: false, data: null, error: "Subscription not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: subscription, error: null });
  } catch (err) {
    console.error("[GET /api/superadmin/tenants/[id]/subscriptions/[subId]]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  PATCH — Confirm payment or change status                          */
/* ------------------------------------------------------------------ */

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subId: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireSuperAdmin(token);
    if (!guard.ok) return guard.response;

    const { id: tenantId, subId } = await params;

    const subscription = await getTenantSubscriptionById(subId);
    if (!subscription) {
      return NextResponse.json({ success: false, data: null, error: "Subscription not found" }, { status: 404 });
    }
    if (subscription.tenantId !== tenantId) {
      return NextResponse.json({ success: false, data: null, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const result = patchSubscriptionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, data: null, error: result.error.issues[0]?.message ?? "Invalid input" },
        { status: 422 }
      );
    }

    let updated;
    if (result.data.action === "confirm_payment") {
      updated = await confirmTenantPayment(subId, {
        paymentRef: result.data.paymentRef,
        paymentMethod: result.data.paymentMethod,
      });
    } else {
      updated = await updateTenantSubscriptionStatus(subId, result.data.status);
    }

    // Keep Organization.plan + planExpiresAt in sync
    await syncTenantPlanCache(tenantId);

    return NextResponse.json({ success: true, data: updated, error: null });
  } catch (err) {
    console.error("[PATCH /api/superadmin/tenants/[id]/subscriptions/[subId]]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
