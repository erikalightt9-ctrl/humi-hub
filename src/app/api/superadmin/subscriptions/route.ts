import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireSuperAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireSuperAdmin(token);
    if (!guard.ok) return guard.response;

    const subscriptions = await prisma.tenantSubscription.findMany({
      include: {
        tenant: {
          select: { name: true, slug: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ success: true, data: subscriptions, error: null });
  } catch (err) {
    console.error("[GET /api/superadmin/subscriptions]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
