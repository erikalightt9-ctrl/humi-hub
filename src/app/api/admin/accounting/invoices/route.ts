import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { requireAccountingWrite, requireAccountingRead } from "@/lib/auth-guards";
import { listInvoices, getInvoiceStats, createInvoice } from "@/lib/repositories/acc-invoice.repository";

const createInvoiceSchema = z.object({
  customerName: z.string().min(1),
  customerEmail: z.string().email().optional(),
  customerAddress: z.string().optional(),
  issueDate: z.string(),
  dueDate: z.string(),
  notes: z.string().optional(),
  currency: z.string().optional(),
  lines: z.array(
    z.object({
      description: z.string().min(1),
      quantity: z.number().positive(),
      unitPrice: z.number().nonnegative(),
      taxRate: z.number().nonnegative().optional(),
      accountId: z.string().optional(),
    })
  ).min(1),
});

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAccountingRead(token);
    if (!guard.ok) return guard.response;
    const { tenantId } = guard;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? undefined;
    const dateFromParam = searchParams.get("dateFrom");
    const dateToParam = searchParams.get("dateTo");
    const search = searchParams.get("search") ?? undefined;
    const page = searchParams.get("page") ? Number(searchParams.get("page")) : undefined;
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;

    const [invoices, stats] = await Promise.all([
      listInvoices(tenantId, {
        ...(status && { status }),
        ...(dateFromParam && { dateFrom: new Date(dateFromParam) }),
        ...(dateToParam && { dateTo: new Date(dateToParam) }),
        ...(search && { search }),
        ...(page && { page }),
        ...(limit && { limit }),
      }),
      getInvoiceStats(tenantId),
    ]);

    return NextResponse.json({ success: true, data: { invoices, stats }, error: null });
  } catch (err) {
    console.error("[GET /api/admin/accounting/invoices]", err);
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
    const parsed = createInvoiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, data: null, error: parsed.error.message },
        { status: 400 }
      );
    }

    const result = await createInvoice(tenantId, {
      ...parsed.data,
      issueDate: new Date(parsed.data.issueDate),
      dueDate: new Date(parsed.data.dueDate),
      createdById: userId,
    });

    return NextResponse.json({ success: true, data: result, error: null }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/accounting/invoices]", err);
    return NextResponse.json(
      { success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
