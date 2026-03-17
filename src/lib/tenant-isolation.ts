/**
 * Tenant Isolation
 *
 * Three helpers that enforce tenant_id filtering at every query boundary:
 *
 *   resolveTenantId  — extract tenantId from auth token (null = superadmin)
 *   scopeToTenant    — add tenantId to any Prisma `where` clause
 *   scopeViaCourse   — same, but for resources nested under a Course
 *   assertTenantOwns — guard single-resource fetches against cross-tenant reads
 *
 * Superadmin receives null and always bypasses filters — they operate at
 * platform level and never touch tenant content directly.
 */

import type { JWT } from "next-auth/jwt";

// ─── Types ────────────────────────────────────────────────────────────────────

/** null  → superadmin (unrestricted)
 *  string → tenant admin (filtered to this tenantId) */
export type TenantScope = string | null;

// ─── Resolve ──────────────────────────────────────────────────────────────────

/**
 * Extract tenantId from a validated auth token.
 *
 * - Superadmin  → returns null (no filter applied)
 * - Tenant admin → returns their tenantId
 * - Invalid token → throws (should never reach here after guard middleware)
 */
export function resolveTenantId(token: JWT): TenantScope {
  if (token.isSuperAdmin) return null;
  if (token.tenantId) return token.tenantId as string;
  throw new Error("Token missing tenantId for non-superadmin caller");
}

// ─── Query Scoping ────────────────────────────────────────────────────────────

/**
 * Inject `tenantId` into a Prisma `where` clause.
 * When scope is null (superadmin) the clause is returned unchanged.
 *
 * @example
 * prisma.course.findMany({
 *   where: scopeToTenant(tenantId, { isActive: true }),
 * });
 */
export function scopeToTenant<T extends Record<string, unknown>>(
  scope: TenantScope,
  extra: T = {} as T,
): T | (T & { tenantId: string }) {
  if (scope === null) return extra;
  return { ...extra, tenantId: scope };
}

/**
 * Scope resources that are nested under a Course (e.g. Lesson, Quiz, Module).
 * Filters via `course.tenantId` rather than a direct column.
 *
 * @example
 * prisma.lesson.findMany({
 *   where: scopeViaCourse(tenantId, { isPublished: true }),
 * });
 */
export function scopeViaCourse<T extends Record<string, unknown>>(
  scope: TenantScope,
  extra: T = {} as T,
): T | (T & { course: { tenantId: string } }) {
  if (scope === null) return extra;
  return { ...extra, course: { tenantId: scope } };
}

// ─── Ownership Guard ──────────────────────────────────────────────────────────

/**
 * Verify that a single fetched resource belongs to the caller's tenant.
 * Superadmin (null) always passes. Throws on mismatch.
 *
 * @example
 * const course = await prisma.course.findUniqueOrThrow({ where: { id } });
 * assertTenantOwns(course.tenantId, tenantId);
 */
export function assertTenantOwns(
  resourceTenantId: string | null | undefined,
  scope: TenantScope,
): void {
  if (scope === null) return; // superadmin: unrestricted
  if (!resourceTenantId || resourceTenantId !== scope) {
    throw new TenantMismatchError();
  }
}

export class TenantMismatchError extends Error {
  readonly statusCode = 403;
  constructor() {
    super("Forbidden: resource does not belong to your tenant");
    this.name = "TenantMismatchError";
  }
}
