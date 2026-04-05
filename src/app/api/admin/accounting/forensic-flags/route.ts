import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAccountingRead } from "@/lib/auth-guards";
import { listForensicFlags, getForensicSummary } from "@/lib/repositories/acc-forensic.repository";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAccountingRead(token);
    if (!guard.ok) return guard.response;
    const { tenantId } = guard;

    const { searchParams } = new URL(request.url);
    const isResolvedParam = searchParams.get("isResolved");
    const severity = searchParams.get("severity") ?? undefined;
    const ruleCode = searchParams.get("ruleCode") ?? undefined;
    const page = searchParams.get("page") ? Number(searchParams.get("page")) : undefined;
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;

    const [flags, summary] = await Promise.all([
      listForensicFlags(tenantId, {
        ...(isResolvedParam !== null && { isResolved: isResolvedParam === "true" }),
        ...(severity && { severity }),
        ...(ruleCode && { ruleCode }),
        ...(page && { page }),
        ...(limit && { limit }),
      }),
      getForensicSummary(tenantId),
    ]);

    return NextResponse.json({ success: true, data: { flags, summary }, error: null });
  } catch (err) {
    console.error("[GET /api/admin/accounting/forensic-flags]", err);
    return NextResponse.json(
      { success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
