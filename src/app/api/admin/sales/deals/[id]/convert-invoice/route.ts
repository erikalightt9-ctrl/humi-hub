import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { convertDealToInvoice } from "@/lib/repositories/crm.repository";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const result = await convertDealToInvoice(guard.tenantId, (await params).id, undefined);

    return NextResponse.json({ success: true, data: result, error: null }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/sales/deals/[id]/convert-invoice]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    const status  = message === "Deal not found"                         ? 404
                  : message === "Only WON deals can be converted to invoices" ? 422
                  : message === "Deal already has an associated invoice"  ? 409
                  : 500;
    return NextResponse.json({ success: false, data: null, error: message }, { status });
  }
}
