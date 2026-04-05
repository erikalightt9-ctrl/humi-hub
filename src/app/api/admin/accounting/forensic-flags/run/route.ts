import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAccountingWrite } from "@/lib/auth-guards";
import {
  runDuplicateInvoiceCheck,
  runRoundNumberCheck,
  runBenfordAnalysis,
  runSplitThresholdCheck,
} from "@/lib/repositories/acc-forensic.repository";

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAccountingWrite(token);
    if (!guard.ok) return guard.response;
    const { tenantId } = guard;

    const [duplicate, roundNumber, benford, splitThreshold] = await Promise.all([
      runDuplicateInvoiceCheck(tenantId),
      runRoundNumberCheck(tenantId),
      runBenfordAnalysis(tenantId),
      runSplitThresholdCheck(tenantId),
    ]);

    return NextResponse.json({
      success: true,
      data: { duplicate, roundNumber, benford, splitThreshold },
      error: null,
    });
  } catch (err) {
    console.error("[POST /api/admin/accounting/forensic-flags/run]", err);
    return NextResponse.json(
      { success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
