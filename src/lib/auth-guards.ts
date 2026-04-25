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

/** Guard for /api/admin/* routes — accepts:
 *  - Super Admin (isSuperAdmin = true) → scoped to DEFAULT_TENANT_ID
 *  - Tenant Admin (isTenantAdmin = true) → scoped to their tenantId
 *  - Corporate team member with explicit userRole (ADMIN/EXECUTIVE/MANAGER) */
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

  // Corporate team member (EXECUTIVE / MANAGER) — same data scope, UI gates permissions
  if (token.userRole && token.tenantId) {
    return { ok: true, tenantId: token.tenantId as string };
  }

  return { ok: false, response: unauthorized() };
}

/** True only when the authenticated user holds the ADMIN role (or is a super/tenant admin).
 *  Use this for write operations that EXECUTIVE / MANAGER should not perform. */
export function isAdminRole(token: JWT | null): boolean {
  if (!token) return false;
  if (token.isSuperAdmin || token.isTenantAdmin) return true;
  return token.userRole === "ADMIN";
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

/* ------------------------------------------------------------------ */
/*  Accounting Guards                                                   */
/* ------------------------------------------------------------------ */

export type AccountingGuardResult =
  | { readonly ok: true; readonly tenantId: string; readonly userId: string; readonly userRole: string }
  | { readonly ok: false; readonly response: NextResponse };

/** Resolve tenantId the same way requireAdmin does, then check role */
function resolveAccountingTenant(
  token: JWT | null,
  allowedRoles: Set<string>
): AccountingGuardResult {
  if (!token?.id) return { ok: false, response: unauthorized() };
  const role = (token.role as string) ?? "";

  // Super admin path — same as requireAdmin
  if (token.isSuperAdmin && role === "admin") {
    const defaultTenantId = process.env.DEFAULT_TENANT_ID;
    if (!defaultTenantId) return { ok: false, response: unauthorized() };
    return { ok: true, tenantId: defaultTenantId, userId: token.id as string, userRole: role };
  }

  // Tenant admin / accountant / auditor path
  if (!allowedRoles.has(role)) return { ok: false, response: unauthorized() };

  // tenantId may live in token.tenantId or token.organizationId depending on session strategy
  const tenantId =
    (token.tenantId as string | undefined) ??
    (token.organizationId as string | undefined);

  if (!tenantId) return { ok: false, response: unauthorized() };
  return { ok: true, tenantId, userId: token.id as string, userRole: role };
}

const ACCOUNTING_WRITE_ROLES = new Set(["admin", "tenant_admin", "accountant"]);
const ACCOUNTING_READ_ROLES  = new Set(["admin", "tenant_admin", "accountant", "auditor"]);

/** Write access: admin, tenant_admin, accountant */
export function requireAccountingWrite(token: JWT | null): AccountingGuardResult {
  return resolveAccountingTenant(token, ACCOUNTING_WRITE_ROLES);
}

/** Read access: admin, tenant_admin, accountant, auditor */
export function requireAccountingRead(token: JWT | null): AccountingGuardResult {
  return resolveAccountingTenant(token, ACCOUNTING_READ_ROLES);
}
