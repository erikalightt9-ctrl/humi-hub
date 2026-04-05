import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAccountingWrite } from "@/lib/auth-guards";
import { sendInvoice } from "@/lib/repositories/acc-invoice.repository";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAccountingWrite(token);
    if (!guard.ok) return guard.response;
    const { tenantId } = guard;

    const { id } = await params;
    const result = await sendInvoice(tenantId, id);
    return NextResponse.json({ success: true, data: result, error: null });
  } catch (err) {
    console.error("[POST /api/admin/accounting/invoices/[id]/send]", err);
    return NextResponse.json(
      { success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
