import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      isSuperAdmin: boolean;
      isTenantAdmin: boolean;
      tenantId: string | null;
      organizationId: string | null;
      mustChangePassword: boolean;
      accessExpiry: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    isSuperAdmin: boolean;
    isTenantAdmin: boolean;
    tenantId: string | null;
    organizationId: string | null;
    mustChangePassword: boolean;
    accessExpiry: string | null;
  }
}
