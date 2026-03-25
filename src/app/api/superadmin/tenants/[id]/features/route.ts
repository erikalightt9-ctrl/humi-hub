import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireSuperAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { invalidateTenantFeatureCache } from "@/lib/feature-flags";

/** GET /api/superadmin/tenants/[id]/features — list feature flags for a tenant */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getToken({ req: request });
  const guard = requireSuperAdmin(token);
  if (!guard.ok) return guard.response;

  const { id: tenantId } = await params;

  const flags = await prisma.tenantFeatureFlag.findMany({
    where: { tenantId },
    orderBy: { feature: "asc" },
  });

  return NextResponse.json({ success: true, data: flags, error: null });
}

/** PATCH /api/superadmin/tenants/[id]/features — toggle a feature for a tenant */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getToken({ req: request });
  const guard = requireSuperAdmin(token);
  if (!guard.ok) return guard.response;

  const { id: tenantId } = await params;
  const body = await request.json();
  const { feature, enabled } = body as { feature: string; enabled: boolean };

  if (!feature || typeof enabled !== "boolean") {
    return NextResponse.json(
      { success: false, data: null, error: "feature and enabled are required" },
      { status: 422 },
    );
  }

  const flag = await prisma.tenantFeatureFlag.upsert({
    where: { tenantId_feature: { tenantId, feature } },
    create: { tenantId, feature, enabled },
    update: { enabled },
  });

  invalidateTenantFeatureCache(tenantId);

  return NextResponse.json({ success: true, data: flag, error: null });
}
