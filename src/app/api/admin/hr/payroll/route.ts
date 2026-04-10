import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-guards";
import { listPayrollRuns, createPayrollRun } from "@/lib/repositories/hr-payroll.repository";

const lineSchema = z.object({
  employeeId:       z.string(),
  basicSalary:      z.number().positive(),
  totalWorkingDays: z.number().positive().optional(),
  daysWorked:       z.number().nonnegative().optional(),
  absentDays:       z.number().nonnegative().optional(),
  lateMins:         z.number().nonnegative().optional(),
  regHolidayDays:   z.number().nonnegative().optional(),
  specHolidayDays:  z.number().nonnegative().optional(),
  overtimeHours:    z.number().nonnegative().optional(),
  nightDiffHours:   z.number().nonnegative().optional(),
  allowances:              z.number().nonnegative().optional(),
  otherDeductions:         z.number().nonnegative().optional(),
  remarks:                 z.string().max(300).optional(),
  pagibigEmployeeOverride:     z.number().nonnegative().optional(),
  pagibigEmployerOverride:     z.number().nonnegative().optional(),
  sssEmployeeOverride:         z.number().nonnegative().optional(),
  sssEmployerOverride:         z.number().nonnegative().optional(),
  philhealthEmployeeOverride:  z.number().nonnegative().optional(),
  philhealthEmployerOverride:  z.number().nonnegative().optional(),
  withholdingTaxOverride:      z.number().nonnegative().optional(),
});

const createSchema = z.object({
  periodStart: z.string(),
  periodEnd:   z.string(),
  payDate:     z.string().optional(),
  notes:       z.string().optional(),
  lines:       z.array(lineSchema).min(1),
});

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(request.url);
    const result = await listPayrollRuns(guard.tenantId, {
      status: searchParams.get("status") ?? undefined,
      page:   searchParams.get("page")  ? Number(searchParams.get("page"))  : undefined,
      limit:  searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
    });

    return NextResponse.json({ success: true, data: result, error: null });
  } catch (err) {
    console.error("[GET /api/admin/hr/payroll]", err);
    return NextResponse.json(
      { success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const body   = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, data: null, error: parsed.error.message }, { status: 400 });
    }

    const run = await createPayrollRun(guard.tenantId, {
      periodStart: new Date(parsed.data.periodStart),
      periodEnd:   new Date(parsed.data.periodEnd),
      payDate:     parsed.data.payDate ? new Date(parsed.data.payDate) : undefined,
      notes:       parsed.data.notes,
      createdById: (token as { id?: string }).id,
      lines:       parsed.data.lines,
    });

    return NextResponse.json({ success: true, data: run, error: null }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/hr/payroll]", err);
    return NextResponse.json(
      { success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
