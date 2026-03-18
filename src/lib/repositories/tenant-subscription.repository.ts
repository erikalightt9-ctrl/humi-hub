import type { SubscriptionStatus, TenantPlan } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  Create                                                             */
/* ------------------------------------------------------------------ */

export async function createTenantSubscription(data: {
  readonly tenantId: string;
  readonly plan: TenantPlan;
  readonly periodStart: Date;
  readonly periodEnd: Date;
  readonly amountCents: number;
  readonly currency?: string;
  readonly paymentMethod?: string | null;
  readonly paymentRef?: string | null;
}) {
  return prisma.tenantSubscription.create({
    data: {
      tenantId: data.tenantId,
      plan: data.plan,
      status: "PENDING",
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
      amountCents: data.amountCents,
      currency: data.currency ?? "PHP",
      paymentMethod: data.paymentMethod ?? null,
      paymentRef: data.paymentRef ?? null,
    },
  });
}

/* ------------------------------------------------------------------ */
/*  Query                                                              */
/* ------------------------------------------------------------------ */

export async function getTenantSubscriptionById(id: string) {
  return prisma.tenantSubscription.findUnique({ where: { id } });
}

export async function getActiveTenantSubscription(tenantId: string) {
  return prisma.tenantSubscription.findFirst({
    where: { tenantId, status: "ACTIVE" },
    orderBy: { periodEnd: "desc" },
  });
}

export async function getTenantSubscriptions(
  tenantId: string,
  page = 1,
  limit = 20
) {
  const skip = (page - 1) * limit;

  const [subscriptions, total] = await Promise.all([
    prisma.tenantSubscription.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.tenantSubscription.count({ where: { tenantId } }),
  ]);

  return {
    data: subscriptions,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/* ------------------------------------------------------------------ */
/*  Status transitions                                                 */
/* ------------------------------------------------------------------ */

export async function confirmTenantPayment(
  id: string,
  opts: {
    readonly paymentRef?: string;
    readonly paymentMethod?: string;
  } = {}
) {
  return prisma.tenantSubscription.update({
    where: { id },
    data: {
      status: "ACTIVE",
      paidAt: new Date(),
      ...(opts.paymentRef !== undefined && { paymentRef: opts.paymentRef }),
      ...(opts.paymentMethod !== undefined && { paymentMethod: opts.paymentMethod }),
    },
  });
}

export async function updateTenantSubscriptionStatus(
  id: string,
  status: SubscriptionStatus
) {
  return prisma.tenantSubscription.update({
    where: { id },
    data: {
      status,
      ...(status === "CANCELLED" && { cancelledAt: new Date() }),
    },
  });
}

/* ------------------------------------------------------------------ */
/*  Sync: mirror active sub back to Organization.plan cache           */
/* ------------------------------------------------------------------ */

export async function syncTenantPlanCache(tenantId: string) {
  const active = await getActiveTenantSubscription(tenantId);

  await prisma.organization.update({
    where: { id: tenantId },
    data: active
      ? { plan: active.plan, planExpiresAt: active.periodEnd }
      : { plan: "TRIAL", planExpiresAt: null },
  });
}
