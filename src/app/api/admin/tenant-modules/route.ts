import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { MODULE_KEYS, resolveEnabledModules } from "@/lib/modules";

/**
 * GET /api/admin/tenant-modules
 * Returns the enabled module map for the currently logged-in tenant admin.
 * Used by AdminLayout to build the dynamic sidebar nav.
 */
export async function GET(request: NextRequest) {
  const token = await getToken({ req: request });

  if (!token?.id) {
    return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
  }

  // Super admins see all modules enabled
  if (token.isSuperAdmin) {
    const allEnabled = Object.fromEntries(MODULE_KEYS.map((k) => [k, true]));
    return NextResponse.json({ success: true, data: { modules: allEnabled }, error: null });
  }

  const tenantId = (token.tenantId ?? token.organizationId) as string | null;
  if (!tenantId) {
    return NextResponse.json({ success: false, data: null, error: "No tenant" }, { status: 400 });
  }

  const flags = await prisma.tenantFeatureFlag.findMany({
    where: { tenantId, feature: { in: [...MODULE_KEYS] } },
    select: { feature: true, enabled: true },
  });

  const modules = resolveEnabledModules(flags);

  return NextResponse.json({ success: true, data: { modules }, error: null });
}
