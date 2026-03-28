/**
 * POST /api/subscriptions/cancel
 *
 * Cancels the active subscription for the authenticated tenant.
 * Requires Tenant Admin role.
 * The subscription remains active until the end of the billing period.
 */

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireTenantAdmin } from "@/lib/auth-guards";
import {
  getActiveTenantSubscription,
  updateTenantSubscriptionStatus,
} from "@/lib/repositories/tenant-subscription.repository";

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    const guard = requireTenantAdmin(token);
    if (!guard.ok) return guard.response;

    const tenantId = guard.tenantId;

    const activeSub = await getActiveTenantSubscription(tenantId);

    if (!activeSub) {
      return NextResponse.json(
        { success: false, data: null, error: "No active subscription found" },
        { status: 404 }
      );
    }

    const cancelled = await updateTenantSubscriptionStatus(
      activeSub.id,
      "CANCELLED"
    );

    return NextResponse.json({
      success: true,
      data: {
        subscriptionId: cancelled.id,
        plan: cancelled.plan,
        status: cancelled.status,
        cancelledAt: cancelled.cancelledAt,
        // Access remains until end of billing period
        accessUntil: cancelled.periodEnd,
      },
      error: null,
    });
  } catch (err) {
    console.error("[POST /api/subscriptions/cancel]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
