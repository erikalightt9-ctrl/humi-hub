import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import {
  getDealById,
  updateDeal,
  deleteDeal,
} from "@/lib/repositories/crm.repository";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const deal = await getDealById(guard.tenantId, (await params).id);
    if (!deal) {
      return NextResponse.json(
        { success: false, data: null, error: "Deal not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: deal, error: null });
  } catch (err) {
    console.error("[GET /api/admin/sales/deals/[id]]", err);
    return NextResponse.json(
      { success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const body = await request.json();

    const deal = await updateDeal(guard.tenantId, (await params).id, {
      title:             body.title             ?? undefined,
      value:             body.value             ?? undefined,
      currency:          body.currency          ?? undefined,
      stage:             body.stage             ?? undefined,
      probability:       body.probability       ?? undefined,
      expectedCloseDate: body.expectedCloseDate ? new Date(body.expectedCloseDate) : undefined,
      contactId:         body.contactId         ?? undefined,
      notes:             body.notes             ?? undefined,
    });

    return NextResponse.json({ success: true, data: deal, error: null });
  } catch (err) {
    console.error("[PUT /api/admin/sales/deals/[id]]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    const status  = message === "Deal not found" ? 404 : 500;
    return NextResponse.json({ success: false, data: null, error: message }, { status });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    await deleteDeal(guard.tenantId, (await params).id);

    return NextResponse.json({ success: true, data: null, error: null });
  } catch (err) {
    console.error("[DELETE /api/admin/sales/deals/[id]]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    const status  = message === "Deal not found" ? 404 : 500;
    return NextResponse.json({ success: false, data: null, error: message }, { status });
  }
}
