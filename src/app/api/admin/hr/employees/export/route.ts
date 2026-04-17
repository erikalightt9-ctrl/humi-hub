import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { listAllActiveForExport } from "@/lib/repositories/hr-employee.repository";
import * as XLSX from "xlsx";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const employees = await listAllActiveForExport(guard.tenantId);

    const rows = employees.map((e) => ({
      "Employee #":           e.employeeNumber,
      "Last Name":            e.lastName,
      "First Name":           e.firstName,
      "Middle Name":          e.middleName ?? "",
      "Email":                e.email,
      "Phone":                e.phone ?? "",
      "Position":             e.position,
      "Department":           e.department ?? "",
      "Employment Type":      e.employmentType,
      "Status":               e.status,
      "Hire Date":            e.hireDate ? new Date(e.hireDate).toLocaleDateString("en-PH") : "",
      "Regularization Date":  e.regularizationDate ? new Date(e.regularizationDate).toLocaleDateString("en-PH") : "",
      "Separation Date":      e.separationDate ? new Date(e.separationDate).toLocaleDateString("en-PH") : "",
      "Last Working Date":    e.lastWorkingDate ? new Date(e.lastWorkingDate).toLocaleDateString("en-PH") : "",
      "Basic Salary":         e.contracts[0]?.basicSalary ? Number(e.contracts[0].basicSalary) : 0,
      "Allowance":            e.allowance ? Number(e.allowance) : 0,
      "Payroll Type":         e.payrollType ?? "MONTHLY",
      "Birth Date":           e.birthDate ? new Date(e.birthDate).toLocaleDateString("en-PH") : "",
      "Gender":               e.gender ?? "",
      "Civil Status":         e.civilStatus ?? "",
      "Nationality":          e.nationality ?? "",
      "Present Address":      e.presentAddress ?? e.address ?? "",
      "Permanent Address":    e.permanentAddress ?? "",
      "SSS Number":           e.sssNumber ?? "",
      "PhilHealth Number":    e.philhealthNumber ?? "",
      "Pag-IBIG Number":      e.pagibigNumber ?? "",
      "TIN":                  e.tinNumber ?? "",
      "Emergency Contact":    e.emergencyContact ?? "",
      "Emergency Relationship": e.emergencyRelationship ?? "",
      "Emergency Phone":      e.emergencyPhone ?? "",
      "Remarks":              e.remarks ?? "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);

    // Column widths
    ws["!cols"] = [
      { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 28 },
      { wch: 16 }, { wch: 22 }, { wch: 22 }, { wch: 18 }, { wch: 12 },
      { wch: 14 }, { wch: 20 }, { wch: 16 }, { wch: 18 }, { wch: 14 },
      { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 12 },
      { wch: 14 }, { wch: 14 }, { wch: 32 }, { wch: 32 }, { wch: 18 },
      { wch: 20 }, { wch: 18 }, { wch: 16 }, { wch: 22 }, { wch: 18 },
      { wch: 16 }, { wch: 28 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employees 201");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const date = new Date().toISOString().split("T")[0];

    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="employees-201-${date}.xlsx"`,
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/hr/employees/export]", err);
    return NextResponse.json(
      { success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
