import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { requireAccountingWrite } from "@/lib/auth-guards";
import { matchBankTransaction } from "@/lib/repositories/acc-bank.repository";

const matchSchema = z.object({ transactionLineId: z.string().min(1) });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAccountingWrite(token);
    if (!guard.ok) return guard.response;

    const { id } = await params;
    const body = await request.json();
    const parsed = matchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, data: null, error: parsed.error.message },
        { status: 400 }
      );
    }

    const result = await matchBankTransaction(id, parsed.data.transactionLineId);
    return NextResponse.json({ success: true, data: result, error: null });
  } catch (err) {
    console.error("[POST /api/admin/accounting/bank-transactions/[id]/match]", err);
    return NextResponse.json(
      { success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
