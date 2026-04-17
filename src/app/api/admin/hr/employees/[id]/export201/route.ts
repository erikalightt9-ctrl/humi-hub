import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { getEmployeeById } from "@/lib/repositories/hr-employee.repository";
import { generateEmployee201Pdf } from "@/lib/pdf/employee201.pdf";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { id } = await params;
    const emp = await getEmployeeById(guard.tenantId, id);
    if (!emp) {
      return NextResponse.json({ success: false, data: null, error: "Employee not found" }, { status: 404 });
    }

    const org = await prisma.organization.findFirst({
      where: { id: guard.tenantId },
      select: { name: true },
    });

    const basicSalary = emp.contracts[0]?.basicSalary
      ? Number(emp.contracts[0].basicSalary)
      : 0;

    const buf = await generateEmployee201Pdf({
      employeeNumber:      emp.employeeNumber,
      firstName:           emp.firstName,
      lastName:            emp.lastName,
      middleName:          emp.middleName,
      birthDate:           emp.birthDate,
      gender:              emp.gender,
      civilStatus:         emp.civilStatus,
      nationality:         (emp as Record<string, unknown>).nationality as string | null,
      phone:               emp.phone,
      email:               emp.email,
      presentAddress:      ((emp as Record<string, unknown>).presentAddress as string | null) ?? emp.address,
      permanentAddress:    (emp as Record<string, unknown>).permanentAddress as string | null,
      sssNumber:           emp.sssNumber,
      philhealthNumber:    emp.philhealthNumber,
      pagibigNumber:       emp.pagibigNumber,
      tinNumber:           emp.tinNumber,
      position:            emp.position,
      department:          emp.department,
      employmentType:      emp.employmentType,
      status:              emp.status,
      hireDate:            emp.hireDate,
      regularizationDate:  emp.regularizationDate,
      separationDate:      emp.separationDate,
      lastWorkingDate:     (emp as Record<string, unknown>).lastWorkingDate as Date | null,
      basicSalary,
      allowance:           (emp as Record<string, unknown>).allowance
                             ? Number((emp as Record<string, unknown>).allowance)
                             : null,
      payrollType:         (emp as Record<string, unknown>).payrollType as string | null,
      emergencyContact:    emp.emergencyContact,
      emergencyRelationship: (emp as Record<string, unknown>).emergencyRelationship as string | null,
      emergencyPhone:      emp.emergencyPhone,
      remarks:             (emp as Record<string, unknown>).remarks as string | null,
      companyName:         org?.name ?? "Company",
      printedAt:           new Date(),
    });

    const filename = `${emp.employeeNumber}-${emp.lastName}-201.pdf`
      .replace(/[^a-zA-Z0-9._-]/g, "_");

    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/hr/employees/[id]/export201]", err);
    return NextResponse.json(
      { success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
