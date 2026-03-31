import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export type HumiAdminPermissions = {
  canReviewTenants: boolean;
  canOnboardTenants: boolean;
  canMonitorPlatform: boolean;
  canProvideSupport: boolean;
  canManageContent: boolean;
};

export type CreateHumiAdminInput = {
  name: string;
  email: string;
  password: string;
  permissions?: Partial<HumiAdminPermissions>;
};

export type UpdateHumiAdminInput = {
  name?: string;
  isActive?: boolean;
  mustChangePassword?: boolean;
} & Partial<HumiAdminPermissions>;

// ── Super Admin management queries ──────────────────────────────

export async function getAllHumiAdmins() {
  return prisma.humiAdmin.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true,
      failedAttempts: true,
      mustChangePassword: true,
      canReviewTenants: true,
      canOnboardTenants: true,
      canMonitorPlatform: true,
      canProvideSupport: true,
      canManageContent: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getHumiAdminById(id: string) {
  return prisma.humiAdmin.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true,
      failedAttempts: true,
      mustChangePassword: true,
      canReviewTenants: true,
      canOnboardTenants: true,
      canMonitorPlatform: true,
      canProvideSupport: true,
      canManageContent: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function createHumiAdmin(data: CreateHumiAdminInput) {
  const passwordHash = await bcrypt.hash(data.password, 12);
  return prisma.humiAdmin.create({
    data: {
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      passwordHash,
      mustChangePassword: true,
      canReviewTenants: data.permissions?.canReviewTenants ?? false,
      canOnboardTenants: data.permissions?.canOnboardTenants ?? false,
      canMonitorPlatform: data.permissions?.canMonitorPlatform ?? false,
      canProvideSupport: data.permissions?.canProvideSupport ?? false,
      canManageContent: data.permissions?.canManageContent ?? false,
    },
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true,
      canReviewTenants: true,
      canOnboardTenants: true,
      canMonitorPlatform: true,
      canProvideSupport: true,
      canManageContent: true,
      createdAt: true,
    },
  });
}

export async function updateHumiAdmin(id: string, data: UpdateHumiAdminInput) {
  return prisma.humiAdmin.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.mustChangePassword !== undefined && { mustChangePassword: data.mustChangePassword }),
      ...(data.canReviewTenants !== undefined && { canReviewTenants: data.canReviewTenants }),
      ...(data.canOnboardTenants !== undefined && { canOnboardTenants: data.canOnboardTenants }),
      ...(data.canMonitorPlatform !== undefined && { canMonitorPlatform: data.canMonitorPlatform }),
      ...(data.canProvideSupport !== undefined && { canProvideSupport: data.canProvideSupport }),
      ...(data.canManageContent !== undefined && { canManageContent: data.canManageContent }),
    },
  });
}

export async function deactivateHumiAdmin(id: string) {
  return prisma.humiAdmin.update({
    where: { id },
    data: { isActive: false },
  });
}

export async function resetHumiAdminFailedAttempts(id: string) {
  return prisma.humiAdmin.update({
    where: { id },
    data: { failedAttempts: 0 },
  });
}

export async function resetHumiAdminPassword(id: string, newPassword: string) {
  const passwordHash = await bcrypt.hash(newPassword, 12);
  return prisma.humiAdmin.update({
    where: { id },
    data: { passwordHash, mustChangePassword: true, failedAttempts: 0 },
  });
}

// ── HUMI Admin portal queries ────────────────────────────────────

export async function getHumiAdminProfile(id: string) {
  return prisma.humiAdmin.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true,
      mustChangePassword: true,
      canReviewTenants: true,
      canOnboardTenants: true,
      canMonitorPlatform: true,
      canProvideSupport: true,
      canManageContent: true,
      createdAt: true,
    },
  });
}

export async function getPlatformStatsForHumiAdmin() {
  const [totalTenants, activeTenants, totalStudents, openTickets, pendingTenants] =
    await Promise.all([
      prisma.organization.count(),
      prisma.organization.count({ where: { isActive: true } }),
      prisma.student.count({ where: { accessGranted: true } }),
      prisma.supportTicket.count({ where: { status: { not: "CLOSED" } } }),
      prisma.organization.count({ where: { isActive: false } }),
    ]);

  return {
    totalTenants,
    activeTenants,
    pendingTenants,
    totalStudents,
    openTickets,
  };
}

export async function getPendingTenantApplications() {
  return prisma.organization.findMany({
    where: { isActive: false },
    select: {
      id: true,
      name: true,
      subdomain: true,
      plan: true,
      createdAt: true,
      _count: { select: { students: true, courses: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getActiveTenants() {
  return prisma.organization.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      subdomain: true,
      plan: true,
      createdAt: true,
      _count: { select: { students: true, courses: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getOpenSupportTickets() {
  return prisma.supportTicket.findMany({
    where: { status: { not: "CLOSED" } },
    select: {
      id: true,
      subject: true,
      status: true,
      priority: true,
      submitterType: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
