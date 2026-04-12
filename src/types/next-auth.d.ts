import "next-auth";
import "next-auth/jwt";

export type HumiAdminPermissions = {
  canReviewTenants: boolean;
  canOnboardTenants: boolean;
  canMonitorPlatform: boolean;
  canProvideSupport: boolean;
  canManageContent: boolean;
};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: "admin" | "student" | "trainer" | "corporate" | "tenant_admin" | "employee" | "humi_admin" | string;
      isSuperAdmin: boolean;
      isTenantAdmin: boolean;
      isHumiAdmin: boolean;
      tenantId: string | null;
      organizationId: string | null;
      mustChangePassword: boolean;
      accessExpiry: string | null;
      humiAdminPermissions: HumiAdminPermissions | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    isSuperAdmin: boolean;
    isTenantAdmin: boolean;
    isHumiAdmin: boolean;
    tenantId: string | null;
    organizationId: string | null;
    mustChangePassword: boolean;
    accessExpiry: string | null;
    humiAdminPermissions: HumiAdminPermissions | null;
  }
}
