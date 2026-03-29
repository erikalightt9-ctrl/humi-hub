import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireSuperAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ tenantId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireSuperAdmin(token);
    if (!guard.ok) return guard.response;

    const { tenantId } = await params;

    const [totalPaid, totalPending, recentPayments] = await Promise.all([
      prisma.payment.aggregate({
        where: {
          status: "PAID",
          enrollment: { organizationId: tenantId },
        },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          status: "PENDING_PAYMENT",
          enrollment: { organizationId: tenantId },
        },
        _sum: { amount: true },
      }),
      prisma.payment.findMany({
        where: { enrollment: { organizationId: tenantId } },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          amount: true,
          status: true,
          method: true,
          createdAt: true,
          paidAt: true,
          enrollment: {
            select: {
              fullName: true,
              email: true,
              course: { select: { title: true } },
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalPaid: totalPaid._sum.amount ?? 0,
        totalPending: totalPending._sum.amount ?? 0,
        recentPayments,
      },
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/superadmin/view/[tenantId]/revenue]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
