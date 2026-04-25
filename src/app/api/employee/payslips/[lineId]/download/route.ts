import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { generatePayslipPdf } from "@/lib/pdf/payslip.pdf";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lineId: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id || token.role !== "employee") {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }

    const { lineId } = await params;
    const employeeId = token.id as string;

    const line = await prisma.hrPayrollLine.findFirst({
      where: { id: lineId, employeeId },
      include: {
        payrollRun: true,
        employee: {
          select: {
            organizationId: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
            position: true,
            department: true,
          },
        },
      },
    });

    if (!line) {
      return NextResponse.json({ success: false, data: null, error: "Payslip not found" }, { status: 404 });
    }

    if (!["APPROVED", "PAID"].includes(line.payrollRun.status)) {
      return NextResponse.json({ success: false, data: null, error: "Payslip not available" }, { status: 403 });
    }

    const org = await prisma.organization.findUnique({
      where: { id: line.employee.organizationId },
      select: { name: true, logoUrl: true },
    });

    const { employee, payrollRun: run } = line;

    const pdfBuffer = await generatePayslipPdf({
      companyName:        org?.name ?? "Your Company",
      companyLogoUrl:     org?.logoUrl ?? undefined,
      employeeNumber:     employee.employeeNumber,
      employeeName:       `${employee.firstName} ${employee.lastName}`,
      position:           employee.position,
      department:         employee.department,
      periodStart:        run.periodStart,
      periodEnd:          run.periodEnd,
      payDate:            run.payDate,
      runNumber:          run.runNumber,
      basicSalary:        Number(line.basicSalary),
      daysWorked:         Number(line.daysWorked),
      absentDays:         Number(line.absentDays),
      lateMins:           Number(line.lateMins),
      regHolidayDays:     Number(line.regHolidayDays),
      specHolidayDays:    Number(line.specHolidayDays),
      holidayPay:         Number(line.holidayPay),
      overtimeHours:      Number(line.overtimeHours),
      overtimePay:        Number(line.overtimePay),
      nightDiffHours:     Number(line.nightDiffHours),
      nightDiffPay:       Number(line.nightDiffPay),
      allowances:         Number(line.allowances),
      grossPay:           Number(line.grossPay),
      absenceDeduction:   Number(line.absenceDeduction),
      lateDeduction:      Number(line.lateDeduction),
      sssEmployee:        Number(line.sssEmployee),
      philhealthEmployee: Number(line.philhealthEmployee),
      pagibigEmployee:    Number(line.pagibigEmployee),
      withholdingTax:     Number(line.withholdingTax),
      otherDeductions:    Number(line.otherDeductions),
      totalDeductions:    Number(line.totalDeductions),
      netPay:             Number(line.netPay),
      remarks:            line.remarks ?? null,
    });

    const filename = `payslip-${employee.employeeNumber}-${run.runNumber}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length":      String(pdfBuffer.length),
      },
    });
  } catch (err) {
    console.error("[GET /api/employee/payslips/[lineId]/download]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
