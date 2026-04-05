import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { requireAccountingWrite, requireAccountingRead } from "@/lib/auth-guards";
import { getExpenseById, updateExpense } from "@/lib/repositories/acc-expense.repository";

const updateExpenseSchema = z.object({
  vendor: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  amount: z.number().positive().optional(),
  taxAmount: z.number().nonnegative().optional(),
  currency: z.string().optional(),
  expenseDate: z.string().optional(),
  receiptUrl: z.string().url().optional(),
  accountId: z.string().optional(),
  paymentAccountId: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAccountingRead(token);
    if (!guard.ok) return guard.response;
    const { tenantId } = guard;

    const { id } = await params;
    const result = await getExpenseById(tenantId, id);
    if (!result) {
      return NextResponse.json({ success: false, data: null, error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result, error: null });
  } catch (err) {
    console.error("[GET /api/admin/accounting/expenses/[id]]", err);
    return NextResponse.json(
      { success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAccountingWrite(token);
    if (!guard.ok) return guard.response;
    const { tenantId } = guard;

    const { id } = await params;
    const body = await request.json();
    const parsed = updateExpenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, data: null, error: parsed.error.message },
        { status: 400 }
      );
    }

    const { expenseDate, ...rest } = parsed.data;
    const result = await updateExpense(tenantId, id, {
      ...rest,
      ...(expenseDate && { expenseDate: new Date(expenseDate) }),
    });

    return NextResponse.json({ success: true, data: result, error: null });
  } catch (err) {
    console.error("[PATCH /api/admin/accounting/expenses/[id]]", err);
    return NextResponse.json(
      { success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
