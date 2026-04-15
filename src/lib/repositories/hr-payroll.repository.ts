import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/* ================================================================== */
/*  Government Contribution Rules                                       */
/* ================================================================== */

export interface GovContribRuleInput {
  contributionType: "SSS" | "PHILHEALTH" | "PAGIBIG" | "INCOME_TAX";
  salaryFrom: number;
  salaryTo?: number;
  employeeShare: number;
  employerShare: number;
  ruleKind: "FIXED" | "RATE";
  effectiveDate: Date;
}

export async function listGovContribRules(organizationId: string) {
  return prisma.hrGovContribRule.findMany({
    where: { organizationId, isActive: true },
    orderBy: [{ contributionType: "asc" }, { salaryFrom: "asc" }],
  });
}

export async function createGovContribRule(
  organizationId: string,
  data: GovContribRuleInput
) {
  return prisma.hrGovContribRule.create({
    data: {
      organizationId,
      contributionType: data.contributionType,
      salaryFrom:   new Prisma.Decimal(data.salaryFrom),
      salaryTo:     data.salaryTo ? new Prisma.Decimal(data.salaryTo) : null,
      employeeShare: new Prisma.Decimal(data.employeeShare),
      employerShare: new Prisma.Decimal(data.employerShare),
      ruleKind:     data.ruleKind,
      effectiveDate: data.effectiveDate,
    },
  });
}

export async function seedDefaultPhGovRules(organizationId: string) {
  type RuleInput = Omit<GovContribRuleInput, "effectiveDate"> & { effectiveDate: Date };
  const effective = new Date("2025-01-01");

  /**
   * SSS 2025 — 15% total (Employee 5%, Employer 10%)
   * Uses official MSC bracket table: salary range → MSC → fixed contribution
   * MSC 3,000  : salary below ₱3,250
   * MSC 3,500  : salary ₱3,250–₱3,749.99
   * MSC 4,000  : salary ₱3,750–₱4,249.99
   * …(+₱500 MSC per ₱500 salary band)…
   * MSC 35,000 : salary ₱34,750 and above
   *
   * employee = MSC × 5%   |   employer = MSC × 10%
   * Source: SSS Circular 2024-003 effective Jan 2025
   * PDF table range: ₱3,000 MSC (floor) → ₱35,000 MSC (ceiling)
   */
  const sssRules: RuleInput[] = [];
  // Floor bracket: any salary below ₱3,250 → MSC ₱3,000
  sssRules.push({
    contributionType: "SSS",
    salaryFrom:    0,
    salaryTo:      3249.99,
    employeeShare: Math.round(3000 * 0.05 * 100) / 100,  // ₱150
    employerShare: Math.round(3000 * 0.10 * 100) / 100,  // ₱300
    ruleKind:      "FIXED",
    effectiveDate: effective,
  });
  // Regular brackets: MSC ₱3,500 → ₱35,000 in ₱500 steps
  for (let msc = 3500; msc <= 35000; msc += 500) {
    const empShare = Math.round(msc * 0.05 * 100) / 100;   // 5%
    const erShare  = Math.round(msc * 0.10 * 100) / 100;   // 10%
    const salFrom  = msc - 250;
    const salTo    = msc === 35000 ? undefined : msc + 249.99;
    sssRules.push({
      contributionType: "SSS",
      salaryFrom:    salFrom,
      salaryTo:      salTo,
      employeeShare: empShare,
      employerShare: erShare,
      ruleKind:      "FIXED",
      effectiveDate: effective,
    });
  }

  /**
   * PhilHealth 2025 — 5% of Basic Monthly Salary (2.5% employee / 2.5% employer)
   * Floor: salary < ₱10,000 → premium basis treated as ₱10,000 → each side ₱250
   * Rate:  ₱10,000 – ₱99,999.99 → 2.5% each
   * Ceiling: salary ≥ ₱100,000 → premium basis capped at ₱100,000 → each side ₱2,500
   * Total monthly premium: ₱500 min → ₱5,000 max
   */
  const philhealthRules: RuleInput[] = [
    { contributionType: "PHILHEALTH", salaryFrom: 0,       salaryTo: 9999.99,   employeeShare: 250,  employerShare: 250,  ruleKind: "FIXED", effectiveDate: effective },
    { contributionType: "PHILHEALTH", salaryFrom: 10000,   salaryTo: 99999.99,  employeeShare: 2.5,  employerShare: 2.5,  ruleKind: "RATE",  effectiveDate: effective },
    { contributionType: "PHILHEALTH", salaryFrom: 100000,  salaryTo: undefined, employeeShare: 2500, employerShare: 2500, ruleKind: "FIXED", effectiveDate: effective },
  ];

  /**
   * Pag-IBIG 2025
   * Salary basis capped at ₱5,000 (max ₱100 employee + ₱100 employer)
   * ≤₱1,500  → employee 1%, employer 2%
   * >₱1,500  → employee 2%, employer 2%
   * Salary cap enforced in computeContribution (salary_base = min(salary, 5000))
   */
  const pagibigRules: RuleInput[] = [
    { contributionType: "PAGIBIG", salaryFrom: 0,       salaryTo: 1500,     employeeShare: 1, employerShare: 2, ruleKind: "RATE", effectiveDate: effective },
    { contributionType: "PAGIBIG", salaryFrom: 1500.01, salaryTo: undefined, employeeShare: 2, employerShare: 2, ruleKind: "RATE", effectiveDate: effective },
  ];

  const allRules = [...sssRules, ...philhealthRules, ...pagibigRules];

  // Clear existing and re-seed
  await prisma.hrGovContribRule.deleteMany({ where: { organizationId } });
  await prisma.hrGovContribRule.createMany({
    data: allRules.map((r) => ({
      organizationId,
      contributionType: r.contributionType,
      salaryFrom:    new Prisma.Decimal(r.salaryFrom),
      salaryTo:      r.salaryTo ? new Prisma.Decimal(r.salaryTo) : null,
      employeeShare: new Prisma.Decimal(r.employeeShare),
      employerShare: new Prisma.Decimal(r.employerShare),
      ruleKind:      r.ruleKind,
      effectiveDate: r.effectiveDate,
    })),
  });
}

/* ================================================================== */
/*  Payroll Engine                                                      */
/* ================================================================== */

interface ContributionResult {
  employee: number;
  employer: number;
}

function computeContribution(
  rules: Awaited<ReturnType<typeof listGovContribRules>>,
  type: string,
  salary: number
): ContributionResult {
  const match = rules
    .filter((r) => r.contributionType === type)
    .find((r) => {
      const from = Number(r.salaryFrom);
      const to   = r.salaryTo ? Number(r.salaryTo) : Infinity;
      return salary >= from && salary <= to;
    });

  if (!match) return { employee: 0, employer: 0 };

  let employee: number;
  let employer: number;

  if (match.ruleKind === "RATE") {
    // Pag-IBIG: apply rate to salary_base = min(salary, ₱5,000) per HDMF rules
    const base = type === "PAGIBIG" ? Math.min(salary, 5000) : salary;
    employee = base * (Number(match.employeeShare) / 100);
    employer = base * (Number(match.employerShare) / 100);
  } else {
    employee = Number(match.employeeShare);
    employer = Number(match.employerShare);
  }

  return { employee: Math.round(employee * 100) / 100, employer: Math.round(employer * 100) / 100 };
}

/**
 * BIR Withholding Tax — TRAIN Law monthly table (2023–2027)
 *
 * Monthly Taxable Income | Tax
 * ≤ ₱20,833             | 0%
 * ₱20,833 – ₱33,333     | 15% of excess over ₱20,833
 * ₱33,333 – ₱66,667     | ₱1,875 + 20% of excess over ₱33,333
 * ₱66,667 – ₱166,667    | ₱8,541.67 + 25% of excess over ₱66,667
 * ₱166,667 – ₱666,667   | ₱33,541.67 + 30% of excess over ₱166,667
 * > ₱666,667             | ₱183,541.67 + 35% of excess over ₱666,667
 */
function computeWithholdingTax(monthlyTaxableIncome: number): number {
  const r = (n: number) => Math.round(n * 100) / 100;
  if (monthlyTaxableIncome <= 20833)  return 0;
  if (monthlyTaxableIncome <= 33333)  return r((monthlyTaxableIncome - 20833)  * 0.15);
  if (monthlyTaxableIncome <= 66667)  return r(1875    + (monthlyTaxableIncome - 33333)  * 0.20);
  if (monthlyTaxableIncome <= 166667) return r(8541.67 + (monthlyTaxableIncome - 66667)  * 0.25);
  if (monthlyTaxableIncome <= 666667) return r(33541.67 + (monthlyTaxableIncome - 166667) * 0.30);
  return r(183541.67 + (monthlyTaxableIncome - 666667) * 0.35);
}

export interface PayrollLineInput {
  employeeId: string;
  basicSalary: number;
  /** Total scheduled working days in pay period (default 22 for monthly) */
  totalWorkingDays?: number;
  /** Actual days present (default = totalWorkingDays - absentDays) */
  daysWorked?: number;
  absentDays?: number;
  /** Minutes late */
  lateMins?: number;
  /** Regular holidays (e.g. New Year, Christmas) worked — DOLE 200% of daily rate */
  regHolidayDays?: number;
  /** Special non-working holidays worked — DOLE 130% of daily rate */
  specHolidayDays?: number;
  /** Regular weekday overtime hours — DOLE 125% of hourly rate */
  overtimeHours?: number;
  /** Night differential hours (10pm–6am) — DOLE +10% of hourly rate */
  nightDiffHours?: number;
  allowances?: number;
  otherDeductions?: number;
  remarks?: string;
  /** Override Pag-IBIG employee share (default ₱200). Use to declare custom amount. */
  pagibigEmployeeOverride?: number;
  /** Override Pag-IBIG employer share (default ₱200). Use to declare custom amount. */
  pagibigEmployerOverride?: number;
  /** Override SSS employee share. Use to declare custom contribution amount. */
  sssEmployeeOverride?: number;
  /** Override SSS employer share. Use to declare custom contribution amount. */
  sssEmployerOverride?: number;
  /** Override PhilHealth employee share. Use to declare custom contribution amount. */
  philhealthEmployeeOverride?: number;
  /** Override PhilHealth employer share. Use to declare custom contribution amount. */
  philhealthEmployerOverride?: number;
  /** Override BIR withholding tax. Use to declare custom tax amount. */
  withholdingTaxOverride?: number;
}

/**
 * Full DOLE-compliant payroll computation.
 *
 * Key rules applied:
 * - Daily rate = monthly basic salary / 22 (industry standard)
 * - Hourly rate = daily rate / 8
 * - Absent deduction = daily rate × absent days
 * - Late deduction = hourly rate × (late minutes / 60)
 * - Regular holiday worked premium = daily rate × 100% (extra) per day
 * - Special non-working holiday worked = daily rate × 30% (extra) per day
 * - Regular day overtime = hourly rate × 0.25 × OT hours  (i.e. +25% premium)
 * - Night differential = hourly rate × 0.10 × ND hours   (i.e. +10% premium)
 * - Gov contributions computed on basic monthly salary
 * - BIR withholding tax on taxable income after mandatory deductions
 */
export async function saveEmployeePayrollDefaults(
  organizationId: string,
  employeeId: string,
  defaults: {
    sssEmployee?: number;
    sssEmployer?: number;
    philhealthEmployee?: number;
    philhealthEmployer?: number;
    pagibigEmployee?: number;
    pagibigEmployer?: number;
    wtaxOverride?: number;
  }
) {
  const employee = await prisma.hrEmployee.findFirst({
    where: { id: employeeId, organizationId },
  });
  if (!employee) throw new Error("Employee not found");

  return prisma.hrEmployee.update({
    where: { id: employeeId },
    data: {
      payrollSssEmployee:        defaults.sssEmployee        != null ? new Prisma.Decimal(defaults.sssEmployee)        : undefined,
      payrollSssEmployer:        defaults.sssEmployer        != null ? new Prisma.Decimal(defaults.sssEmployer)        : undefined,
      payrollPhilhealthEmployee: defaults.philhealthEmployee != null ? new Prisma.Decimal(defaults.philhealthEmployee) : undefined,
      payrollPhilhealthEmployer: defaults.philhealthEmployer != null ? new Prisma.Decimal(defaults.philhealthEmployer) : undefined,
      payrollPagibigEmployee:    defaults.pagibigEmployee    != null ? new Prisma.Decimal(defaults.pagibigEmployee)    : undefined,
      payrollPagibigEmployer:    defaults.pagibigEmployer    != null ? new Prisma.Decimal(defaults.pagibigEmployer)    : undefined,
      payrollWtaxOverride:       defaults.wtaxOverride       != null ? new Prisma.Decimal(defaults.wtaxOverride)       : undefined,
    },
  });
}

export async function computePayrollLine(
  organizationId: string,
  input: PayrollLineInput
) {
  const [rules, employee] = await Promise.all([
    listGovContribRules(organizationId),
    prisma.hrEmployee.findFirst({
      where: { id: input.employeeId, organizationId },
      select: {
        payrollSssEmployee:        true,
        payrollSssEmployer:        true,
        payrollPhilhealthEmployee: true,
        payrollPhilhealthEmployer: true,
        payrollPagibigEmployee:    true,
        payrollPagibigEmployer:    true,
        payrollWtaxOverride:       true,
      },
    }),
  ]);

  // Merge: explicit per-run override > employee saved default > auto-computed
  const mergedInput: PayrollLineInput = {
    ...input,
    sssEmployeeOverride:        input.sssEmployeeOverride        ?? (employee?.payrollSssEmployee        != null ? Number(employee.payrollSssEmployee)        : undefined),
    sssEmployerOverride:        input.sssEmployerOverride        ?? (employee?.payrollSssEmployer        != null ? Number(employee.payrollSssEmployer)        : undefined),
    philhealthEmployeeOverride: input.philhealthEmployeeOverride ?? (employee?.payrollPhilhealthEmployee != null ? Number(employee.payrollPhilhealthEmployee) : undefined),
    philhealthEmployerOverride: input.philhealthEmployerOverride ?? (employee?.payrollPhilhealthEmployer != null ? Number(employee.payrollPhilhealthEmployer) : undefined),
    pagibigEmployeeOverride:    input.pagibigEmployeeOverride    ?? (employee?.payrollPagibigEmployee    != null ? Number(employee.payrollPagibigEmployee)    : undefined),
    pagibigEmployerOverride:    input.pagibigEmployerOverride    ?? (employee?.payrollPagibigEmployer    != null ? Number(employee.payrollPagibigEmployer)    : undefined),
    withholdingTaxOverride:     input.withholdingTaxOverride     ?? (employee?.payrollWtaxOverride       != null ? Number(employee.payrollWtaxOverride)       : undefined),
  };

  const totalWorkingDays = mergedInput.totalWorkingDays ?? 22;
  const absentDays       = mergedInput.absentDays  ?? 0;
  const lateMins         = mergedInput.lateMins    ?? 0;
  const regHolidayDays   = mergedInput.regHolidayDays  ?? 0;
  const specHolidayDays  = mergedInput.specHolidayDays ?? 0;
  const overtimeHours    = mergedInput.overtimeHours   ?? 0;
  const nightDiffHours   = mergedInput.nightDiffHours  ?? 0;

  const dailyRate  = mergedInput.basicSalary / totalWorkingDays;
  const hourlyRate = dailyRate / 8;

  // Days actually worked (capped at scheduled days)
  const daysWorked = mergedInput.daysWorked
    ?? Math.max(0, totalWorkingDays - absentDays - regHolidayDays);

  // Earned basic pay (present days only; holidays handled separately)
  const earnedBasic = dailyRate * daysWorked;

  // Deductions for absences and tardiness
  const absenceDeduction = dailyRate * absentDays;
  const lateDeduction    = hourlyRate * (lateMins / 60);

  // Holiday pay premiums (DOLE)
  // Regular holiday worked: employee gets 200% → premium above base = +100%
  const regHolidayPremium  = dailyRate * 1.00 * regHolidayDays;
  // Reg holiday BASE (even if worked, 100% is already in basicSalary; we add the premium day)
  const regHolidayBase     = dailyRate * 1.00 * regHolidayDays;
  // Special non-working holiday worked: 130% → premium above base = +30%
  const specHolidayPremium = dailyRate * 0.30 * specHolidayDays;
  const specHolidayBase    = dailyRate * 1.00 * specHolidayDays;

  const holidayPay = regHolidayPremium + regHolidayBase + specHolidayPremium + specHolidayBase;

  // Overtime premium (DOLE: regular day OT = +25% per OT hour above 8-hr rate)
  const overtimePay  = hourlyRate * 0.25 * overtimeHours;

  // Night differential (+10% per ND hour)
  const nightDiffPay = hourlyRate * 0.10 * nightDiffHours;

  const allowances = mergedInput.allowances ?? 0;

  // Gross pay = earned basic + holiday pay + OT premium + night diff + allowances
  const grossPay = earnedBasic + holidayPay + overtimePay + nightDiffPay + allowances;

  // Gov contributions on monthly basic salary (not reduced by absences)
  const sssComputed        = computeContribution(rules, "SSS",        mergedInput.basicSalary);
  const philhealthComputed = computeContribution(rules, "PHILHEALTH", mergedInput.basicSalary);
  const pagibigComputed    = computeContribution(rules, "PAGIBIG",    mergedInput.basicSalary);

  const sss = {
    employee: mergedInput.sssEmployeeOverride ?? sssComputed.employee,
    employer: mergedInput.sssEmployerOverride ?? sssComputed.employer,
  };
  const philhealth = {
    employee: mergedInput.philhealthEmployeeOverride ?? philhealthComputed.employee,
    employer: mergedInput.philhealthEmployerOverride ?? philhealthComputed.employer,
  };
  const pagibig = {
    employee: mergedInput.pagibigEmployeeOverride ?? pagibigComputed.employee,
    employer: mergedInput.pagibigEmployerOverride ?? pagibigComputed.employer,
  };

  // Taxable income = gross - mandatory deductions - absence - late
  const taxableIncome = grossPay
    - absenceDeduction
    - lateDeduction
    - sss.employee
    - philhealth.employee
    - pagibig.employee;
  const withholdingTax = mergedInput.withholdingTaxOverride ?? computeWithholdingTax(Math.max(0, taxableIncome));

  const totalDeductions =
    absenceDeduction +
    lateDeduction +
    sss.employee +
    philhealth.employee +
    pagibig.employee +
    withholdingTax +
    (mergedInput.otherDeductions ?? 0);

  const netPay = Math.max(0, grossPay - totalDeductions);

  return {
    employeeId:          mergedInput.employeeId,
    basicSalary:         mergedInput.basicSalary,
    daysWorked,
    absentDays,
    lateMins,
    regHolidayDays,
    specHolidayDays,
    holidayPay,
    overtimeHours,
    overtimePay,
    nightDiffHours,
    nightDiffPay,
    allowances,
    grossPay,
    absenceDeduction,
    lateDeduction,
    sssEmployee:         sss.employee,
    sssEmployer:         sss.employer,
    philhealthEmployee:  philhealth.employee,
    philhealthEmployer:  philhealth.employer,
    pagibigEmployee:     pagibig.employee,
    pagibigEmployer:     pagibig.employer,
    withholdingTax,
    otherDeductions:     mergedInput.otherDeductions ?? 0,
    totalDeductions,
    netPay,
    remarks:             mergedInput.remarks ?? null,
  };
}

/* ================================================================== */
/*  Payroll Run CRUD                                                    */
/* ================================================================== */

async function getNextRunNumber(organizationId: string): Promise<string> {
  const count = await prisma.hrPayrollRun.count({ where: { organizationId } });
  const year  = new Date().getFullYear();
  return `PR-${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function listPayrollRuns(
  organizationId: string,
  filters: { status?: string; page?: number; limit?: number }
) {
  const page  = filters.page  ?? 1;
  const limit = filters.limit ?? 10;

  const where: Prisma.HrPayrollRunWhereInput = {
    organizationId,
    ...(filters.status && { status: filters.status as never }),
  };

  const [data, total] = await Promise.all([
    prisma.hrPayrollRun.findMany({
      where,
      include: { _count: { select: { lines: true } } },
      orderBy: { periodStart: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.hrPayrollRun.count({ where }),
  ]);

  return { data, total, page, limit };
}

export async function getPayrollLineWithEmployee(
  organizationId: string,
  runId: string,
  lineId: string
) {
  return prisma.hrPayrollLine.findFirst({
    where: {
      id: lineId,
      payrollRunId: runId,
      payrollRun: { organizationId },
    },
    include: {
      payrollRun: true,
      employee: {
        select: {
          firstName: true, lastName: true, employeeNumber: true,
          position: true, department: true,
          sssNumber: true, philhealthNumber: true,
          pagibigNumber: true, tinNumber: true,
        },
      },
    },
  });
}

export async function getPayrollRunById(organizationId: string, id: string) {
  return prisma.hrPayrollRun.findFirst({
    where: { id, organizationId },
    include: {
      lines: {
        include: {
          employee: {
            select: {
              firstName: true, lastName: true, employeeNumber: true,
              position: true, department: true,
            },
          },
        },
      },
    },
  });
}

export async function createPayrollRun(
  organizationId: string,
  data: {
    periodStart: Date;
    periodEnd: Date;
    payDate?: Date;
    notes?: string;
    createdById?: string;
    lines: PayrollLineInput[];
  }
) {
  const runNumber = await getNextRunNumber(organizationId);
  const computed  = await Promise.all(
    data.lines.map((l) => computePayrollLine(organizationId, l))
  );

  const totalGross      = computed.reduce((s, l) => s + l.grossPay,        0);
  const totalDeductions = computed.reduce((s, l) => s + l.totalDeductions,  0);
  const totalNet        = computed.reduce((s, l) => s + l.netPay,           0);

  return prisma.hrPayrollRun.create({
    data: {
      organizationId,
      runNumber,
      periodStart:      data.periodStart,
      periodEnd:        data.periodEnd,
      payDate:          data.payDate    ?? null,
      notes:            data.notes      ?? null,
      createdById:      data.createdById ?? null,
      totalGross:       new Prisma.Decimal(totalGross),
      totalDeductions:  new Prisma.Decimal(totalDeductions),
      totalNet:         new Prisma.Decimal(totalNet),
      status:           "DRAFT",
      lines: {
        create: computed.map((l) => ({
          employeeId:          l.employeeId,
          basicSalary:         new Prisma.Decimal(l.basicSalary),
          daysWorked:          new Prisma.Decimal(l.daysWorked),
          absentDays:          new Prisma.Decimal(l.absentDays),
          lateMins:            new Prisma.Decimal(l.lateMins),
          regHolidayDays:      new Prisma.Decimal(l.regHolidayDays),
          specHolidayDays:     new Prisma.Decimal(l.specHolidayDays),
          holidayPay:          new Prisma.Decimal(l.holidayPay),
          overtimeHours:       new Prisma.Decimal(l.overtimeHours),
          overtimePay:         new Prisma.Decimal(l.overtimePay),
          nightDiffHours:      new Prisma.Decimal(l.nightDiffHours),
          nightDiffPay:        new Prisma.Decimal(l.nightDiffPay),
          allowances:          new Prisma.Decimal(l.allowances),
          grossPay:            new Prisma.Decimal(l.grossPay),
          absenceDeduction:    new Prisma.Decimal(l.absenceDeduction),
          lateDeduction:       new Prisma.Decimal(l.lateDeduction),
          sssEmployee:         new Prisma.Decimal(l.sssEmployee),
          sssEmployer:         new Prisma.Decimal(l.sssEmployer),
          philhealthEmployee:  new Prisma.Decimal(l.philhealthEmployee),
          philhealthEmployer:  new Prisma.Decimal(l.philhealthEmployer),
          pagibigEmployee:     new Prisma.Decimal(l.pagibigEmployee),
          pagibigEmployer:     new Prisma.Decimal(l.pagibigEmployer),
          withholdingTax:      new Prisma.Decimal(l.withholdingTax),
          otherDeductions:     new Prisma.Decimal(l.otherDeductions),
          totalDeductions:     new Prisma.Decimal(l.totalDeductions),
          netPay:              new Prisma.Decimal(l.netPay),
          remarks:             l.remarks,
        })),
      },
    },
    include: { lines: { include: { employee: { select: { firstName: true, lastName: true, employeeNumber: true } } } } },
  });
}

export async function approvePayrollRun(
  organizationId: string,
  id: string,
  approvedById: string
) {
  const run = await prisma.hrPayrollRun.findFirst({ where: { id, organizationId } });
  if (!run) throw new Error("Payroll run not found");
  if (run.status !== "DRAFT") throw new Error("Only DRAFT payroll runs can be approved");

  return prisma.hrPayrollRun.update({
    where: { id },
    data: { status: "APPROVED", approvedById, approvedAt: new Date() },
  });
}

export async function markPayrollPaid(
  organizationId: string,
  id: string,
  paidById: string,
  payDate: Date
) {
  const run = await prisma.hrPayrollRun.findFirst({ where: { id, organizationId } });
  if (!run) throw new Error("Payroll run not found");
  if (run.status !== "APPROVED") throw new Error("Only APPROVED payroll runs can be marked as paid");

  return prisma.hrPayrollRun.update({
    where: { id },
    data: { status: "PAID", paidById, paidAt: new Date(), payDate },
  });
}

/**
 * Recompute and update a single payroll line (e.g. after editing declared salary).
 * Re-runs the full DOLE computation and updates the run totals.
 */
export async function updatePayrollLine(
  organizationId: string,
  runId: string,
  lineId: string,
  input: PayrollLineInput
) {
  // Verify line belongs to org
  const existing = await prisma.hrPayrollLine.findFirst({
    where: { id: lineId, payrollRunId: runId, payrollRun: { organizationId } },
  });
  if (!existing) throw new Error("Payroll line not found");

  const computed = await computePayrollLine(organizationId, input);

  await prisma.hrPayrollLine.update({
    where: { id: lineId },
    data: {
      basicSalary:         new Prisma.Decimal(computed.basicSalary),
      daysWorked:          new Prisma.Decimal(computed.daysWorked),
      absentDays:          new Prisma.Decimal(computed.absentDays),
      lateMins:            new Prisma.Decimal(computed.lateMins),
      regHolidayDays:      new Prisma.Decimal(computed.regHolidayDays),
      specHolidayDays:     new Prisma.Decimal(computed.specHolidayDays),
      holidayPay:          new Prisma.Decimal(computed.holidayPay),
      overtimeHours:       new Prisma.Decimal(computed.overtimeHours),
      overtimePay:         new Prisma.Decimal(computed.overtimePay),
      nightDiffHours:      new Prisma.Decimal(computed.nightDiffHours),
      nightDiffPay:        new Prisma.Decimal(computed.nightDiffPay),
      allowances:          new Prisma.Decimal(computed.allowances),
      grossPay:            new Prisma.Decimal(computed.grossPay),
      absenceDeduction:    new Prisma.Decimal(computed.absenceDeduction),
      lateDeduction:       new Prisma.Decimal(computed.lateDeduction),
      sssEmployee:         new Prisma.Decimal(computed.sssEmployee),
      sssEmployer:         new Prisma.Decimal(computed.sssEmployer),
      philhealthEmployee:  new Prisma.Decimal(computed.philhealthEmployee),
      philhealthEmployer:  new Prisma.Decimal(computed.philhealthEmployer),
      pagibigEmployee:     new Prisma.Decimal(computed.pagibigEmployee),
      pagibigEmployer:     new Prisma.Decimal(computed.pagibigEmployer),
      withholdingTax:      new Prisma.Decimal(computed.withholdingTax),
      otherDeductions:     new Prisma.Decimal(computed.otherDeductions),
      totalDeductions:     new Prisma.Decimal(computed.totalDeductions),
      netPay:              new Prisma.Decimal(computed.netPay),
      remarks:             computed.remarks,
    },
  });

  // Recompute run totals
  const lines = await prisma.hrPayrollLine.findMany({ where: { payrollRunId: runId } });
  const totalGross      = lines.reduce((s, l) => s + Number(l.grossPay),       0);
  const totalDeductions = lines.reduce((s, l) => s + Number(l.totalDeductions), 0);
  const totalNet        = lines.reduce((s, l) => s + Number(l.netPay),          0);

  return prisma.hrPayrollRun.update({
    where: { id: runId },
    data: {
      totalGross:      new Prisma.Decimal(totalGross),
      totalDeductions: new Prisma.Decimal(totalDeductions),
      totalNet:        new Prisma.Decimal(totalNet),
    },
  });
}
