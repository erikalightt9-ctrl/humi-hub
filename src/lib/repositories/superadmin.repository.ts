import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  Tenant (Organization) Management                                   */
/* ------------------------------------------------------------------ */

export async function getAllTenantsWithStats() {
  return prisma.organization.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      subdomain: true,
      customDomain: true,
      email: true,
      plan: true,
      planExpiresAt: true,
      isActive: true,
      isDefault: true,
      logoUrl: true,
      primaryColor: true,
      createdAt: true,
      _count: {
        select: {
          students: true,
          managers: true,
          courses: true,
        },
      },
    },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}

export async function getTenantById(id: string) {
  return prisma.organization.findUnique({
    where: { id },
    include: {
      _count: {
        select: { students: true, managers: true, courses: true, enrollments: true },
      },
    },
  });
}

export async function createTenant(data: {
  name: string;
  slug: string;
  subdomain: string;
  email: string;
  industry?: string;
  plan?: "TRIAL" | "STARTER" | "PROFESSIONAL" | "ENTERPRISE";
  maxSeats?: number;
  siteName?: string;
  tagline?: string;
  primaryColor?: string;
  secondaryColor?: string;
  adminName: string;
  adminEmail: string;
  adminPasswordHash: string;
}) {
  const { adminName, adminEmail, adminPasswordHash, ...orgData } = data;

  return prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        ...orgData,
        isDefault: false,
        isActive: true,
        plan: orgData.plan ?? "TRIAL",
      },
    });

    const manager = await tx.corporateManager.create({
      data: {
        organizationId: org.id,
        name: adminName,
        email: adminEmail,
        passwordHash: adminPasswordHash,
        role: "admin",
        isActive: true,
        isTenantAdmin: true,
        mustChangePassword: true,
      },
    });

    return { org, manager };
  });
}

export async function updateTenant(
  id: string,
  data: Partial<{
    name: string;
    subdomain: string;
    customDomain: string | null;
    email: string;
    isActive: boolean;
    plan: "TRIAL" | "STARTER" | "PROFESSIONAL" | "ENTERPRISE";
    planExpiresAt: Date | null;
    billingEmail: string | null;
    maxSeats: number;
    siteName: string | null;
    tagline: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    logoUrl: string | null;
    faviconUrl: string | null;
    bannerImageUrl: string | null;
    mission: string | null;
    vision: string | null;
  }>
) {
  return prisma.organization.update({ where: { id }, data });
}

/* ------------------------------------------------------------------ */
/*  Platform-wide Analytics                                            */
/* ------------------------------------------------------------------ */

export async function getPlatformAnalytics() {
  const [tenantCount, activeTenants, trialTenants, totalStudents, totalCourses] =
    await Promise.all([
      prisma.organization.count(),
      prisma.organization.count({ where: { isActive: true } }),
      prisma.organization.count({ where: { plan: "TRIAL", isActive: true } }),
      prisma.student.count(),
      prisma.course.count({ where: { isActive: true } }),
    ]);

  return { tenantCount, activeTenants, trialTenants, totalStudents, totalCourses };
}

/* ------------------------------------------------------------------ */
/*  Revenue Analytics                                                  */
/* ------------------------------------------------------------------ */

export async function getRevenueAnalytics() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [
    allPaidSubs,
    planDistribution,
    recentPayments,
  ] = await Promise.all([
    // All-time paid subscriptions
    prisma.tenantSubscription.aggregate({
      where: { status: { in: ["ACTIVE", "EXPIRED", "CANCELLED"] }, paidAt: { not: null } },
      _sum: { amountCents: true },
      _count: { id: true },
    }),
    // Count of active tenants by plan
    prisma.organization.groupBy({
      by: ["plan"],
      where: { isActive: true },
      _count: { id: true },
    }),
    // Last 12 months of payments
    prisma.tenantSubscription.findMany({
      where: {
        paidAt: { gte: new Date(now.getFullYear() - 1, now.getMonth(), 1) },
        status: { in: ["ACTIVE", "EXPIRED"] },
      },
      select: {
        amountCents: true,
        currency: true,
        paidAt: true,
        plan: true,
        tenantId: true,
      },
      orderBy: { paidAt: "desc" },
      take: 50,
    }),
  ]);

  // MRR = sum of ACTIVE subscriptions' monthly value
  const activeSubs = await prisma.tenantSubscription.findMany({
    where: { status: "ACTIVE" },
    select: { amountCents: true, periodStart: true, periodEnd: true },
  });

  const mrrCents = activeSubs.reduce((sum, sub) => {
    const days = Math.max(
      1,
      (new Date(sub.periodEnd).getTime() - new Date(sub.periodStart).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    // Normalise to 30-day month
    return sum + Math.round((sub.amountCents / days) * 30);
  }, 0);

  const totalRevenueCents = allPaidSubs._sum.amountCents ?? 0;
  const totalPayments = allPaidSubs._count.id;

  return {
    mrrCents,
    arrCents: mrrCents * 12,
    totalRevenueCents,
    totalPayments,
    planDistribution: planDistribution.map((p) => ({
      plan: p.plan,
      count: p._count.id,
    })),
    recentPayments: recentPayments.map((p) => ({
      amountCents: p.amountCents,
      currency: p.currency,
      paidAt: p.paidAt,
      plan: p.plan,
    })),
  };
}
