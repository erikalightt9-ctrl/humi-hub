/**
 * GET /api/subscriptions/status
 *
 * Returns the current subscription status for the authenticated tenant.
 * Accessible by Tenant Admins only.
 *
 * Response shape:
 * {
 *   plan: "TRIAL" | "STARTER" | "PROFESSIONAL" | "ENTERPRISE",
 *   status: "PENDING" | "ACTIVE" | "PAST_DUE" | "EXPIRED" | "CANCELLED" | null,
 *   periodStart: string | null,
 *   periodEnd: string | null,
 *   amountCents: number | null,
 *   isActive: boolean,
 *   daysRemaining: number | null,
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireTenantAdmin } from "@/lib/auth-guards";
import { getActiveTenantSubscription } from "@/lib/repositories/tenant-subscription.repository";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    const guard = requireTenantAdmin(token);
    if (!guard.ok) return guard.response;

    const tenantId = guard.tenantId;

    // Load the org for cached plan info
    const org = await prisma.organization.findUnique({
      where: { id: tenantId },
      select: {
        plan: true,
        planExpiresAt: true,
        name: true,
        billingEmail: true,
        email: true,
      },
    });

    if (!org) {
      return NextResponse.json(
        { success: false, data: null, error: "Tenant not found" },
        { status: 404 }
      );
    }

    // Load the active subscription (if any)
    const activeSub = await getActiveTenantSubscription(tenantId);

    const now = new Date();
    const isActive = activeSub !== null && activeSub.periodEnd > now;
    const daysRemaining = isActive
      ? Math.ceil(
          (activeSub.periodEnd.getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : null;

    // Also load the most recent pending subscription (in case payment is in-progress)
    const pendingSub = !activeSub
      ? await prisma.tenantSubscription.findFirst({
          where: { tenantId, status: "PENDING" },
          orderBy: { createdAt: "desc" },
        })
      : null;

    return NextResponse.json({
      success: true,
      data: {
        plan: org.plan,
        status: activeSub?.status ?? pendingSub?.status ?? null,
        periodStart: activeSub?.periodStart?.toISOString() ?? null,
        periodEnd: activeSub?.periodEnd?.toISOString() ?? null,
        amountCents: activeSub?.amountCents ?? null,
        currency: activeSub?.currency ?? "PHP",
        isActive,
        daysRemaining,
        billingEmail: org.billingEmail ?? org.email,
        // Pending checkout info (if awaiting payment)
        pendingCheckout: pendingSub
          ? {
              subscriptionId: pendingSub.id,
              plan: pendingSub.plan,
              amountCents: pendingSub.amountCents,
            }
          : null,
      },
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/subscriptions/status]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
