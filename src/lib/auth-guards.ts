import type { JWT } from "next-auth/jwt";
import { NextResponse } from "next/server";

export type GuardResult =
  | { readonly ok: true; readonly tenantId: string }
  | { readonly ok: false; readonly response: NextResponse };

function unauthorized(): NextResponse {
  return NextResponse.json(
    { success: false, data: null, error: "Unauthorized" },
    { status: 401 },
  );
}

/** Guard for /api/superadmin/* routes — platform-level Super Admin only. */
export function requireSuperAdmin(token: JWT | null): GuardResult {
  if (!token?.id || !token.isSuperAdmin) {
    return { ok: false, response: unauthorized() };
  }
  // Super admin always operates on the default tenant (from env)
  const defaultTenantId = process.env.DEFAULT_TENANT_ID;
  if (!defaultTenantId) {
    console.error("DEFAULT_TENANT_ID env var is not set");
    return { ok: false, response: unauthorized() };
  }
  return { ok: true, tenantId: defaultTenantId };
}

/** Guard for /api/admin/* routes — accepts either:
 *  - a Super Admin (isSuperAdmin = true) → scoped to DEFAULT_TENANT_ID
 *  - a Tenant Admin (isTenantAdmin = true) → scoped to their own tenantId */
export function requireAdmin(token: JWT | null): GuardResult {
  if (!token?.id) return { ok: false, response: unauthorized() };

  if (token.isSuperAdmin && token.role === "admin") {
    const defaultTenantId = process.env.DEFAULT_TENANT_ID;
    if (!defaultTenantId) {
      console.error("DEFAULT_TENANT_ID env var is not set");
      return { ok: false, response: unauthorized() };
    }
    return { ok: true, tenantId: defaultTenantId };
  }

  if (token.isTenantAdmin && token.tenantId) {
    return { ok: true, tenantId: token.tenantId as string };
  }

  return { ok: false, response: unauthorized() };
}

/** Guard for /api/corporate/* routes — any corporate or tenant_admin user. */
export function requireCorporate(token: JWT | null): GuardResult {
  const validRoles = ["corporate", "tenant_admin"];
  if (
    !token?.id ||
    !validRoles.includes(token.role as string) ||
    !token.organizationId
  ) {
    return { ok: false, response: unauthorized() };
  }
  return { ok: true, tenantId: token.organizationId as string };
}

/** Guard for student-facing routes. */
export function requireStudent(token: JWT | null): GuardResult {
  if (!token?.id || token.role !== "student") {
    return { ok: false, response: unauthorized() };
  }
  return { ok: true, tenantId: (token.tenantId as string) ?? "" };
}

/** Guard for trainer-facing routes. */
export function requireTrainer(token: JWT | null): GuardResult {
  if (!token?.id || token.role !== "trainer") {
    return { ok: false, response: unauthorized() };
  }
  return { ok: true, tenantId: (token.tenantId as string) ?? "" };
}

/** Guard for tenant admin routes — only isTenantAdmin users (not super admin). */
export function requireTenantAdmin(token: JWT | null): GuardResult {
  if (!token?.id) return { ok: false, response: unauthorized() };
  if (token.isTenantAdmin && token.tenantId) {
    return { ok: true, tenantId: token.tenantId as string };
  }
  return { ok: false, response: unauthorized() };
}
