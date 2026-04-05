import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { requireAccountingWrite, requireAccountingRead } from "@/lib/auth-guards";
import { getInvoiceById, updateInvoice } from "@/lib/repositories/acc-invoice.repository";

const updateInvoiceSchema = z.object({
  customerName: z.string().optional(),
  customerEmail: z.string().email().optional(),
  customerAddress: z.string().optional(),
  issueDate: z.string().optional(),
  dueDate: z.string().optional(),
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
  ).optional(),
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
    const result = await getInvoiceById(tenantId, id);
    if (!result) {
      return NextResponse.json({ success: false, data: null, error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result, error: null });
  } catch (err) {
    console.error("[GET /api/admin/accounting/invoices/[id]]", err);
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
    const parsed = updateInvoiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, data: null, error: parsed.error.message },
        { status: 400 }
      );
    }

    const { issueDate, dueDate, ...rest } = parsed.data;
    const result = await updateInvoice(tenantId, id, {
      ...rest,
      ...(issueDate && { issueDate: new Date(issueDate) }),
      ...(dueDate && { dueDate: new Date(dueDate) }),
    });

    return NextResponse.json({ success: true, data: result, error: null });
  } catch (err) {
    console.error("[PATCH /api/admin/accounting/invoices/[id]]", err);
    return NextResponse.json(
      { success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
