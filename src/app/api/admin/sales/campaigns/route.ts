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

    const campaigns = await prisma.crmCampaign.findMany({
      where: {
        organizationId: guard.tenantId,
        ...(status ? { status: status as never } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: campaigns, error: null });
  } catch (err) {
    console.error("[GET /api/admin/sales/campaigns]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const body = await request.json() as {
      name: string; type: string; status?: string;
      budget?: number; startDate?: string; endDate?: string;
      description?: string; channel?: string;
    };

    const campaign = await prisma.crmCampaign.create({
      data: {
        organizationId: guard.tenantId,
        name:        body.name,
        type:        body.type as never,
        status:      (body.status ?? "DRAFT") as never,
        budget:      body.budget ?? null,
        startDate:   body.startDate ? new Date(body.startDate) : null,
        endDate:     body.endDate   ? new Date(body.endDate)   : null,
        description: body.description ?? null,
        channel:     body.channel ?? null,
      },
    });

    return NextResponse.json({ success: true, data: campaign, error: null });
  } catch (err) {
    console.error("[POST /api/admin/sales/campaigns]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
