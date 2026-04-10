/**
 * PATCH /api/admin/hr/payroll/[id]/lines/[lineId]
 * Recomputes a payroll line with new inputs (e.g. declared salary override).
 */
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-guards";
import { updatePayrollLine } from "@/lib/repositories/hr-payroll.repository";

const schema = z.object({
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lineId: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { id, lineId } = await params;
    const body   = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, data: null, error: parsed.error.message }, { status: 400 });
    }

    await updatePayrollLine(guard.tenantId, id, lineId, parsed.data);
    return NextResponse.json({ success: true, data: null, error: null });
  } catch (err) {
    console.error("[PATCH /api/admin/hr/payroll/[id]/lines/[lineId]]", err);
    return NextResponse.json(
      { success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
