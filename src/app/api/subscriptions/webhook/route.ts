/**
 * POST /api/subscriptions/webhook
 *
 * PayMongo webhook receiver for SaaS tenant subscription payments.
 * Handles:
 *   - payment.paid   → activate subscription, update org plan, seed feature flags
 *   - payment.failed → mark subscription as PAST_DUE
 *
 * Signature verification uses PAYMONGO_WEBHOOK_SECRET env var.
 * Register this URL in the PayMongo dashboard as a webhook endpoint.
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import {
  confirmTenantPayment,
  updateTenantSubscriptionStatus,
  syncTenantPlanCache,
} from "@/lib/repositories/tenant-subscription.repository";
import {
  seedDefaultFlags,
  invalidateTenantFeatureCache,
} from "@/lib/feature-flags";
import type { TenantPlan } from "@prisma/client";

// ── Signature verification ─────────────────────────────────────────────────

function verifySignature(rawBody: string, signatureHeader: string): boolean {
  const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[SaaS Webhook] PAYMONGO_WEBHOOK_SECRET is not set");
    return false;
  }

  const parts = signatureHeader.split(",");
  const sigMap = new Map<string, string>();
  for (const part of parts) {
    const [key, value] = part.split("=");
    if (key && value) sigMap.set(key.trim(), value.trim());
  }

  const timestamp = sigMap.get("t");
  if (!timestamp) {
    console.error("[SaaS Webhook] Missing timestamp in signature");
    return false;
  }

  const computed = crypto
    .createHmac("sha256", webhookSecret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  const live = sigMap.get("li");
  const test = sigMap.get("te");
  const candidate = live ?? test;
  if (!candidate) {
    console.error("[SaaS Webhook] No li/te signature found");
    return false;
  }

  try {
    return crypto.timingSafeEqual(
      Buffer.from(computed, "hex"),
      Buffer.from(candidate, "hex")
    );
  } catch {
    return false;
  }
}

// ── PayMongo webhook payload shape ─────────────────────────────────────────

interface PayMongoWebhookPayload {
  readonly data: {
    readonly id: string;
    readonly attributes: {
      readonly type: string;
      readonly data: {
        readonly id: string;
        readonly attributes: {
          readonly amount: number;
          readonly status: string;
          readonly description?: string;
          readonly payment_method_used?: string;
          readonly source?: {
            readonly id: string;
            readonly type: string;
          };
        };
      };
    };
  };
}

// ── Handler ────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signatureHeader = request.headers.get("paymongo-signature") ?? "";

  // Skip signature check in test/dev environments without the secret set
  const isDev = process.env.NODE_ENV === "development";
  if (!isDev && signatureHeader) {
    const valid = verifySignature(rawBody, signatureHeader);
    if (!valid) {
      console.warn("[SaaS Webhook] Invalid signature — rejecting");
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 401 }
      );
    }
  }

  let payload: PayMongoWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as PayMongoWebhookPayload;
  } catch {
    return NextResponse.json(
      { success: false, error: "Malformed JSON" },
      { status: 400 }
    );
  }

  const eventType = payload.data?.attributes?.type;
  const paymentData = payload.data?.attributes?.data?.attributes;
  const source = paymentData?.source;

  // Only handle events originating from payment links
  const linkId =
    source?.type === "link" ? source.id : null;

  if (!linkId) {
    // Not a payment-link event — ignore silently
    return NextResponse.json({ received: true });
  }

  // Look up the PENDING subscription by paymentRef = linkId
  const subscription = await prisma.tenantSubscription.findFirst({
    where: { paymentRef: linkId, status: "PENDING" },
    include: { tenant: { select: { id: true, name: true } } },
  });

  if (!subscription) {
    console.warn("[SaaS Webhook] No PENDING subscription found for link:", linkId);
    return NextResponse.json({ received: true });
  }

  // ── payment.paid ────────────────────────────────────────────────────────
  if (eventType === "payment.paid") {
    const paymentId = payload.data.attributes.data.id;
    const paymentMethod = paymentData?.payment_method_used ?? "paymongo_link";

    // Activate the subscription
    await confirmTenantPayment(subscription.id, {
      paymentRef: paymentId,
      paymentMethod,
    });

    // Mirror plan onto Organization.plan
    await syncTenantPlanCache(subscription.tenantId);

    // Seed feature flags for the new plan (upsert — won't overwrite customisations)
    await seedDefaultFlags(subscription.tenantId, subscription.plan as TenantPlan);
    invalidateTenantFeatureCache(subscription.tenantId);

    console.info(
      `[SaaS Webhook] Subscription ${subscription.id} ACTIVATED` +
        ` — tenant: ${subscription.tenant.name}, plan: ${subscription.plan}`
    );
  }

  // ── payment.failed ──────────────────────────────────────────────────────
  if (eventType === "payment.failed") {
    await updateTenantSubscriptionStatus(subscription.id, "PAST_DUE");

    console.warn(
      `[SaaS Webhook] Subscription ${subscription.id} → PAST_DUE` +
        ` — tenant: ${subscription.tenant.name}`
    );
  }

  return NextResponse.json({ received: true });
}
