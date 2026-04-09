import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { moveDealStage } from "@/lib/repositories/crm.repository";
import { CrmDealStage } from "@prisma/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const body = await request.json();

    if (!body.stage || typeof body.stage !== "string") {
      return NextResponse.json(
        { success: false, data: null, error: "stage is required" },
        { status: 400 }
      );
    }

    const deal = await moveDealStage(guard.tenantId, (await params).id, body.stage as CrmDealStage);

    return NextResponse.json({ success: true, data: deal, error: null });
  } catch (err) {
    console.error("[PATCH /api/admin/sales/deals/[id]/stage]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    const status  = message === "Deal not found" ? 404 : 500;
    return NextResponse.json({ success: false, data: null, error: message }, { status });
  }
}
