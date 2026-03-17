import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { Organization } from "@prisma/client";

export interface TenantContext {
  readonly tenantId: string;
  readonly tenant: Organization;
  readonly isDefault: boolean;
}

/** Called from Server Components and API route handlers.
 *  Reads the x-tenant-subdomain header set by middleware. */
export async function resolveTenantFromSubdomain(): Promise<TenantContext | null> {
  const headersList = await headers();
  const subdomain = headersList.get("x-tenant-subdomain");
  if (!subdomain) return null;

  const tenant = await prisma.organization.findUnique({
    where: { subdomain, isActive: true },
  });
  if (!tenant) return null;

  return { tenantId: tenant.id, tenant, isDefault: tenant.isDefault };
}

/** Resolve tenant by subdomain string (used in public API routes). */
export async function getTenantBySubdomain(subdomain: string): Promise<Organization | null> {
  return prisma.organization.findUnique({
    where: { subdomain, isActive: true },
  });
}

/** Look up tenant by ID (used in auth-guarded API routes). */
export async function getTenantById(tenantId: string): Promise<Organization | null> {
  return prisma.organization.findUnique({
    where: { id: tenantId, isActive: true },
  });
}
