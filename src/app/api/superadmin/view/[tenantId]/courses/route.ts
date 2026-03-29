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

    const courses = await prisma.course.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        isActive: true,
        currency: true,
        createdAt: true,
        _count: { select: { enrollments: true } },
      },
    });

    return NextResponse.json({ success: true, data: courses, error: null });
  } catch (err) {
    console.error("[GET /api/superadmin/view/[tenantId]/courses]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
