import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import {
  listDeals,
  createDeal,
} from "@/lib/repositories/crm.repository";
import { CrmDealStage } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(request.url);
    const stage     = searchParams.get("stage")     ?? undefined;
    const contactId = searchParams.get("contactId") ?? undefined;
    const page      = searchParams.get("page")  ? Number(searchParams.get("page"))  : undefined;
    const limit     = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;

    const result = await listDeals(guard.tenantId, {
      stage:     stage as CrmDealStage | undefined,
      contactId,
      page,
      limit,
    });

    return NextResponse.json({ success: true, data: result, error: null });
  } catch (err) {
    console.error("[GET /api/admin/sales/deals]", err);
    return NextResponse.json(
      { success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const body = await request.json();

    if (!body.title || typeof body.title !== "string") {
      return NextResponse.json(
        { success: false, data: null, error: "title is required" },
        { status: 400 }
      );
    }

    const deal = await createDeal(guard.tenantId, {
      title:             body.title,
      value:             body.value             ?? undefined,
      currency:          body.currency          ?? undefined,
      stage:             body.stage             ?? undefined,
      probability:       body.probability       ?? undefined,
      expectedCloseDate: body.expectedCloseDate ? new Date(body.expectedCloseDate) : undefined,
      contactId:         body.contactId         ?? undefined,
      notes:             body.notes             ?? undefined,
    });

    return NextResponse.json({ success: true, data: deal, error: null }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/sales/deals]", err);
    return NextResponse.json(
      { success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
