import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const requests = await prisma.itRequest.findMany({
      where: {
        organizationId: guard.tenantId,
        ...(status ? { status: status as never } : {}),
      },
      include: {
        submittedBy: { select: { firstName: true, lastName: true, position: true } },
        asset: { select: { assetTag: true, assetName: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const counts = await prisma.itRequest.groupBy({
      by: ["status"],
      where: { organizationId: guard.tenantId },
      _count: { _all: true },
    });

    return NextResponse.json({ success: true, data: { requests, counts }, error: null });
  } catch (err) {
    console.error("[GET /api/admin/it/requests]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const body = await request.json() as { id: string; status: string; assignedToId?: string };

    const updated = await prisma.itRequest.update({
      where: { id: body.id },
      data: {
        status:       body.status as never,
        assignedToId: body.assignedToId ?? undefined,
        resolvedAt:   ["RESOLVED", "CLOSED"].includes(body.status) ? new Date() : undefined,
      },
    });

    return NextResponse.json({ success: true, data: updated, error: null });
  } catch (err) {
    console.error("[PATCH /api/admin/it/requests]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
