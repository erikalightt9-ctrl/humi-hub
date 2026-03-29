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

    const students = await prisma.student.findMany({
      where: { organizationId: tenantId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        accessGranted: true,
        createdAt: true,
        enrollment: {
          select: {
            course: { select: { title: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: students, error: null });
  } catch (err) {
    console.error("[GET /api/superadmin/view/[tenantId]/students]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
