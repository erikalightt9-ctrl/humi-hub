import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireSuperAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

/** GET /api/superadmin/tenants/[id]/admins — list tenant admins */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getToken({ req: request });
  const guard = requireSuperAdmin(token);
  if (!guard.ok) return guard.response;

  const { id: tenantId } = await params;

  const admins = await prisma.corporateManager.findMany({
    where: { organizationId: tenantId },
    select: {
      id: true,
      email: true,
      name: true,
      isTenantAdmin: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ success: true, data: admins, error: null });
}
