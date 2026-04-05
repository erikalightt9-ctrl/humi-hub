import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { requireAccountingWrite, requireAccountingRead } from "@/lib/auth-guards";
import { listExpenses, getExpenseStats, createExpense } from "@/lib/repositories/acc-expense.repository";

const createExpenseSchema = z.object({
  vendor: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  amount: z.number().positive(),
  taxAmount: z.number().nonnegative().optional(),
  currency: z.string().optional(),
  expenseDate: z.string(),
  receiptUrl: z.string().url().optional(),
  accountId: z.string().optional(),
  paymentAccountId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAccountingRead(token);
    if (!guard.ok) return guard.response;
    const { tenantId } = guard;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? undefined;
    const category = searchParams.get("category") ?? undefined;
    const dateFromParam = searchParams.get("dateFrom");
    const dateToParam = searchParams.get("dateTo");
    const search = searchParams.get("search") ?? undefined;
    const page = searchParams.get("page") ? Number(searchParams.get("page")) : undefined;
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;

    const [expenses, stats] = await Promise.all([
      listExpenses(tenantId, {
        ...(status && { status }),
        ...(category && { category }),
        ...(dateFromParam && { dateFrom: new Date(dateFromParam) }),
        ...(dateToParam && { dateTo: new Date(dateToParam) }),
        ...(search && { search }),
        ...(page && { page }),
        ...(limit && { limit }),
      }),
      getExpenseStats(tenantId),
    ]);

    return NextResponse.json({ success: true, data: { expenses, stats }, error: null });
  } catch (err) {
    console.error("[GET /api/admin/accounting/expenses]", err);
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
    const parsed = createExpenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, data: null, error: parsed.error.message },
        { status: 400 }
      );
    }

    const result = await createExpense(tenantId, {
      ...parsed.data,
      expenseDate: new Date(parsed.data.expenseDate),
      submittedById: userId,
    });

    return NextResponse.json({ success: true, data: result, error: null }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/accounting/expenses]", err);
    return NextResponse.json(
      { success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
