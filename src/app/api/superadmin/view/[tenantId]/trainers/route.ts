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

    const tenantTrainers = await prisma.tenantTrainer.findMany({
      where: { tenantId },
      orderBy: { assignedAt: "desc" },
      select: {
        assignedAt: true,
        isActive: true,
        trainer: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
            tier: true,
            createdAt: true,
          },
        },
      },
    });

    const trainers = tenantTrainers.map(({ trainer, assignedAt, isActive }) => ({
      ...trainer,
      assignedAt,
      tenantActive: isActive,
    }));

    return NextResponse.json({ success: true, data: trainers, error: null });
  } catch (err) {
    console.error("[GET /api/superadmin/view/[tenantId]/trainers]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
