import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { requireAccountingWrite, requireAccountingRead } from "@/lib/auth-guards";
import { listTransactions, createTransaction } from "@/lib/repositories/acc-transaction.repository";

const createTransactionSchema = z.object({
  date: z.string(),
  description: z.string().min(1),
  reference: z.string().optional(),
  lines: z.array(
    z.object({
      accountId: z.string(),
      description: z.string().optional(),
      debitAmount: z.number(),
      creditAmount: z.number(),
    })
  ).min(2),
});

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAccountingRead(token);
    if (!guard.ok) return guard.response;
    const { tenantId } = guard;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as "DRAFT" | "POSTED" | "VOIDED" | null;
    const dateFromParam = searchParams.get("dateFrom");
    const dateToParam = searchParams.get("dateTo");
    const search = searchParams.get("search") ?? undefined;
    const page = searchParams.get("page") ? Number(searchParams.get("page")) : undefined;
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;

    const result = await listTransactions(tenantId, {
      ...(status && { status }),
      ...(dateFromParam && { dateFrom: new Date(dateFromParam) }),
      ...(dateToParam && { dateTo: new Date(dateToParam) }),
      ...(search && { search }),
      ...(page && { page }),
      ...(limit && { limit }),
    });

    return NextResponse.json({ success: true, data: result, error: null });
  } catch (err) {
    console.error("[GET /api/admin/accounting/transactions]", err);
    return NextResponse.json(
      { success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAccountingWrite(token);
    if (!guard.ok) return guard.response;
    const { tenantId, userId } = guard;

    const body = await request.json();
    const parsed = createTransactionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, data: null, error: parsed.error.message },
        { status: 400 }
      );
    }

    const result = await createTransaction(tenantId, {
      date: new Date(parsed.data.date),
      description: parsed.data.description,
      reference: parsed.data.reference,
      createdById: userId,
      lines: parsed.data.lines,
    });

    return NextResponse.json({ success: true, data: result, error: null }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/accounting/transactions]", err);
    return NextResponse.json(
      { success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
