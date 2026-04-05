import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAccountingRead } from "@/lib/auth-guards";
import { getGeneralLedger } from "@/lib/repositories/acc-reports.repository";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAccountingRead(token);
    if (!guard.ok) return guard.response;
    const { tenantId } = guard;

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");
    if (!accountId) {
      return NextResponse.json(
        { success: false, data: null, error: "accountId query parameter is required" },
        { status: 400 }
      );
    }

    const dateFrom = new Date(searchParams.get("dateFrom") ?? new Date().toISOString());
    const dateTo = new Date(searchParams.get("dateTo") ?? new Date().toISOString());

    const result = await getGeneralLedger(tenantId, accountId, dateFrom, dateTo);
    return NextResponse.json({ success: true, data: result, error: null });
  } catch (err) {
    console.error("[GET /api/admin/accounting/reports/general-ledger]", err);
    return NextResponse.json(
      { success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
