import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireSuperAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

/** GET /api/superadmin/billing — platform billing overview */
export async function GET(request: NextRequest) {
  const token = await getToken({ req: request });
  const guard = requireSuperAdmin(token);
  if (!guard.ok) return guard.response;

  const [tenants, subscriptions] = await Promise.all([
    prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        planExpiresAt: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { students: true, enrollments: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.tenantSubscription.findMany({
      where: { status: { in: ["ACTIVE", "PAST_DUE"] } },
      select: {
        tenantId: true,
        plan: true,
        status: true,
        periodEnd: true,
        amountCents: true,
        currency: true,
      },
      orderBy: { periodEnd: "asc" },
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: { tenants, subscriptions },
    error: null,
  });
}
