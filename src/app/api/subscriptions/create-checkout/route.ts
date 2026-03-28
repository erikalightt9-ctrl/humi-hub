/**
 * POST /api/subscriptions/create-checkout
 *
 * Creates a PayMongo payment link for a tenant subscription upgrade/renewal.
 * Requires the caller to be an authenticated Tenant Admin.
 *
 * Body: { plan: "STARTER" | "PROFESSIONAL" | "ENTERPRISE" }
 * Returns: { checkoutUrl, subscriptionId, plan, amountCents }
 */

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { requireTenantAdmin } from "@/lib/auth-guards";
import { createTenantSubscription } from "@/lib/repositories/tenant-subscription.repository";
import { prisma } from "@/lib/prisma";
import {
  createSaasPaymentLink,
  PLAN_PRICES_CENTAVOS,
} from "@/lib/services/paymongo-saas.service";

const bodySchema = z.object({
  plan: z.enum(["STARTER", "PROFESSIONAL", "ENTERPRISE"]),
});

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    const guard = requireTenantAdmin(token);
    if (!guard.ok) return guard.response;

    const tenantId = guard.tenantId;

    // Validate body
    const raw = await request.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: parsed.error.issues[0]?.message ?? "Invalid request body",
        },
        { status: 422 }
      );
    }

    const { plan } = parsed.data;
    const amountCents = PLAN_PRICES_CENTAVOS[plan] ?? 0;

    if (amountCents <= 0) {
      return NextResponse.json(
        { success: false, data: null, error: "Selected plan has no charge" },
        { status: 400 }
      );
    }

    // Load the tenant to get its name for the payment description
    const org = await prisma.organization.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, billingEmail: true, email: true },
    });

    if (!org) {
      return NextResponse.json(
        { success: false, data: null, error: "Tenant not found" },
        { status: 404 }
      );
    }

    // Monthly period: today → +30 days
    const periodStart = new Date();
    const periodEnd = new Date(periodStart);
    periodEnd.setDate(periodEnd.getDate() + 30);

    // Create PENDING subscription record
    const subscription = await createTenantSubscription({
      tenantId,
      plan,
      periodStart,
      periodEnd,
      amountCents,
      currency: "PHP",
      paymentMethod: "paymongo_link",
    });

    // Create PayMongo payment link
    const link = await createSaasPaymentLink({
      subscriptionId: subscription.id,
      tenantName: org.name,
      plan,
      amountCentavos: amountCents,
    });

    // Store the PayMongo link ID so the webhook can resolve the subscription
    await prisma.tenantSubscription.update({
      where: { id: subscription.id },
      data: { paymentRef: link.linkId },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          subscriptionId: subscription.id,
          plan,
          amountCents,
          checkoutUrl: link.checkoutUrl,
          referenceNumber: link.referenceNumber,
        },
        error: null,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/subscriptions/create-checkout]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
