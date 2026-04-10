/**
 * PATCH /api/admin/hr/employees/[id]/payroll-defaults
 * Saves declared contribution defaults for an employee so they
 * auto-apply to every future payroll run without manual re-entry.
 */
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-guards";
import { saveEmployeePayrollDefaults } from "@/lib/repositories/hr-payroll.repository";

const schema = z.object({
  sssEmployee:        z.number().nonnegative().optional(),
  sssEmployer:        z.number().nonnegative().optional(),
  philhealthEmployee: z.number().nonnegative().optional(),
  philhealthEmployer: z.number().nonnegative().optional(),
  pagibigEmployee:    z.number().nonnegative().optional(),
  pagibigEmployer:    z.number().nonnegative().optional(),
  wtaxOverride:       z.number().nonnegative().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { id } = await params;
    const body   = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, data: null, error: parsed.error.message }, { status: 400 });
    }

    await saveEmployeePayrollDefaults(guard.tenantId, id, parsed.data);
    return NextResponse.json({ success: true, data: null, error: null });
  } catch (err) {
    console.error("[PATCH /api/admin/hr/employees/[id]/payroll-defaults]", err);
    return NextResponse.json(
      { success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
