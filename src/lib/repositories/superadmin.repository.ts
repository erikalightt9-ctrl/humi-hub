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
