"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Loader2, AlertCircle, ArrowLeft, Download, FileDown,
  CheckCircle, DollarSign, Users, Edit2, X, Save, Info,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface PayrollLine {
  id: string;
  employeeId: string;
  basicSalary: number;
  daysWorked: number;
  absentDays: number;
  lateMins: number;
  regHolidayDays: number;
  specHolidayDays: number;
  holidayPay: number;
  overtimeHours: number;
  overtimePay: number;
  nightDiffHours: number;
  nightDiffPay: number;
  allowances: number;
  grossPay: number;
  absenceDeduction: number;
  lateDeduction: number;
  sssEmployee: number;
  philhealthEmployee: number;
  pagibigEmployee: number;
  withholdingTax: number;
  otherDeductions: number;
  totalDeductions: number;
  netPay: number;
  remarks: string | null;
  employee: {
    firstName: string;
    lastName: string;
    employeeNumber: string;
    position: string;
    department: string | null;
  };
}

interface PayrollRun {
  id: string;
  runNumber: string;
  periodStart: string;
  periodEnd: string;
  payDate: string | null;
  status: "DRAFT" | "APPROVED" | "PAID" | "VOIDED";
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  lines: PayrollLine[];
}

/* ------------------------------------------------------------------ */
/*  Edit Line Modal                                                      */
/* ------------------------------------------------------------------ */

interface EditForm {
  basicSalary: string;
  totalWorkingDays: string;
  absentDays: string;
  lateMins: string;
  regHolidayDays: string;
  specHolidayDays: string;
  overtimeHours: string;
  nightDiffHours: string;
  allowances: string;
  otherDeductions: string;
  remarks: string;
}

function toEditForm(line: PayrollLine): EditForm {
  return {
    basicSalary:      String(Number(line.basicSalary)),
    totalWorkingDays: "22",
    absentDays:       String(Number(line.absentDays)),
    lateMins:         String(Number(line.lateMins)),
    regHolidayDays:   String(Number(line.regHolidayDays)),
    specHolidayDays:  String(Number(line.specHolidayDays)),
    overtimeHours:    String(Number(line.overtimeHours)),
    nightDiffHours:   String(Number(line.nightDiffHours)),
    allowances:       String(Number(line.allowances)),
    otherDeductions:  String(Number(line.otherDeductions)),
    remarks:          line.remarks ?? "",
  };
}

function EditLineModal({
  runId,
  line,
  onClose,
  onSaved,
}: {
  runId: string;
  line: PayrollLine;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm]     = useState<EditForm>(toEditForm(line));
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  function set(key: keyof EditForm, val: string) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res  = await fetch(`/api/admin/hr/payroll/${runId}/lines/${line.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId:       line.employeeId,
          basicSalary:      parseFloat(form.basicSalary)      || 0,
          totalWorkingDays: parseFloat(form.totalWorkingDays) || 22,
          absentDays:       parseFloat(form.absentDays)       || 0,
          lateMins:         parseFloat(form.lateMins)         || 0,
          regHolidayDays:   parseFloat(form.regHolidayDays)   || 0,
          specHolidayDays:  parseFloat(form.specHolidayDays)  || 0,
          overtimeHours:    parseFloat(form.overtimeHours)    || 0,
          nightDiffHours:   parseFloat(form.nightDiffHours)   || 0,
          allowances:       parseFloat(form.allowances)       || 0,
          otherDeductions:  parseFloat(form.otherDeductions)  || 0,
          remarks:          form.remarks || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Save failed");
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 text-right";

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-800">
              Edit Payslip — {line.employee.lastName}, {line.employee.firstName}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {line.employee.employeeNumber} · Changes trigger full DOLE recomputation
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Declared salary note */}
          <div className="flex items-start gap-2 text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg p-3">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>
              <strong>Declared Salary</strong> is the basis for SSS, PhilHealth, Pag-IBIG, and BIR withholding tax.
              Adjust this to match what you remit to government agencies.
            </span>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />{error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {/* Salary */}
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Declared Basic Salary (₱) <span className="text-red-500">*</span>
              </label>
              <input type="number" min={0} step="100"
                value={form.basicSalary}
                onChange={(e) => set("basicSalary", e.target.value)}
                className={inputCls + " text-base font-bold text-indigo-700 border-indigo-200 bg-indigo-50"} />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Working Days in Period</label>
              <input type="number" min={1} step="1" value={form.totalWorkingDays}
                onChange={(e) => set("totalWorkingDays", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Absent Days</label>
              <input type="number" min={0} step="0.5" value={form.absentDays}
                onChange={(e) => set("absentDays", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Late (minutes)</label>
              <input type="number" min={0} step="1" value={form.lateMins}
                onChange={(e) => set("lateMins", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Reg. Holiday Worked</label>
              <input type="number" min={0} step="1" value={form.regHolidayDays}
                onChange={(e) => set("regHolidayDays", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Spec. Holiday Worked</label>
              <input type="number" min={0} step="1" value={form.specHolidayDays}
                onChange={(e) => set("specHolidayDays", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Overtime Hours</label>
              <input type="number" min={0} step="0.5" value={form.overtimeHours}
                onChange={(e) => set("overtimeHours", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Night Diff Hours</label>
              <input type="number" min={0} step="0.5" value={form.nightDiffHours}
                onChange={(e) => set("nightDiffHours", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Allowances (₱)</label>
              <input type="number" min={0} step="100" value={form.allowances}
                onChange={(e) => set("allowances", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Other Deductions (₱)</label>
              <input type="number" min={0} step="100" value={form.otherDeductions}
                onChange={(e) => set("otherDeductions", e.target.value)} className={inputCls} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">Remarks</label>
              <input type="text" maxLength={300} value={form.remarks}
                onChange={(e) => set("remarks", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Optional" />
            </div>
          </div>

          {/* 2025 contribution reference */}
          <div className="text-xs text-slate-400 bg-slate-50 rounded-lg p-3 space-y-0.5">
            <p className="font-medium text-slate-500 mb-1">2025/2026 Gov't Contribution Rates</p>
            <p>• SSS: 4.5% employee / 9.5% employer (max MSC ₱30,000 → max emp ₱1,350)</p>
            <p>• PhilHealth: 2.5% employee / 2.5% employer (floor ₱500, cap ₱2,500)</p>
            <p>• Pag-IBIG: 2% employee CAPPED ₱100 / 2% employer CAPPED ₱100</p>
            <p>• BIR: TRAIN Law graduated rates (0–35%)</p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-60">
            {saving
              ? <><Loader2 className="h-4 w-4 animate-spin" />Recomputing…</>
              : <><Save className="h-4 w-4" />Save & Recompute</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

const fmt   = (n: number) => `₱${Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
const fmtDt = (s: string) => new Date(s).toLocaleDateString("en-PH");

const STATUS_STYLES: Record<string, string> = {
  DRAFT:    "bg-slate-100 text-slate-600",
  APPROVED: "bg-blue-100 text-blue-700",
  PAID:     "bg-green-100 text-green-700",
  VOIDED:   "bg-red-100 text-red-600",
};

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function PayrollRunDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [run, setRun]         = useState<PayrollRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [editLine, setEditLine] = useState<PayrollLine | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`/api/admin/hr/payroll/${id}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setRun(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error ?? "Payroll run not found"}</span>
        </div>
      </div>
    );
  }

  const isDraft = run.status === "DRAFT";

  return (
    <>
      {editLine && (
        <EditLineModal
          runId={id}
          line={editLine}
          onClose={() => setEditLine(null)}
          onSaved={() => { setEditLine(null); load(); }}
        />
      )}

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/hr/payroll" className="text-slate-400 hover:text-slate-600">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-slate-900 font-mono">{run.runNumber}</h1>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[run.status]}`}>
                  {run.status}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                {fmtDt(run.periodStart)} — {fmtDt(run.periodEnd)}
                {run.payDate && ` · Pay Date: ${fmtDt(run.payDate)}`}
              </p>
            </div>
          </div>
          <a
            href={`/api/admin/hr/payroll/${id}/payslips`}
            download
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
          >
            <FileDown className="h-4 w-4" />
            Download All Payslips
          </a>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-indigo-400" />
            <div>
              <p className="text-xs text-slate-500">Employees</p>
              <p className="text-xl font-bold text-slate-800">{run.lines.length}</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-emerald-400" />
            <div>
              <p className="text-xs text-slate-500">Total Net Pay</p>
              <p className="text-xl font-bold text-emerald-700">{fmt(Number(run.totalNet))}</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500">Gross Pay</p>
            <p className="text-base font-semibold text-slate-700">{fmt(Number(run.totalGross))}</p>
            <p className="text-xs text-slate-400 mt-0.5">Deductions: {fmt(Number(run.totalDeductions))}</p>
          </div>
        </div>

        {/* Employee Payslips table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-slate-400" />
              Employee Payslips
            </h2>
            <p className="text-xs text-slate-400">{run.lines.length} records</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <th className="px-5 py-3 text-left">Employee</th>
                <th className="px-5 py-3 text-right">Basic</th>
                <th className="px-5 py-3 text-right">Holiday</th>
                <th className="px-5 py-3 text-right">OT Pay</th>
                <th className="px-5 py-3 text-right">Gross Pay</th>
                <th className="px-5 py-3 text-right">Deductions</th>
                <th className="px-5 py-3 text-right font-bold text-indigo-700">Net Pay</th>
                <th className="px-5 py-3 text-center">Payslip</th>
                {isDraft && <th className="px-5 py-3 text-center">Edit</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {run.lines.map((line) => (
                <tr key={line.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-800">
                      {line.employee.lastName}, {line.employee.firstName}
                    </p>
                    <p className="text-xs text-slate-400">
                      {line.employee.employeeNumber} · {line.employee.position}
                    </p>
                    {line.employee.department && (
                      <p className="text-xs text-slate-400">{line.employee.department}</p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right text-slate-600 font-mono text-xs">
                    {fmt(Number(line.basicSalary))}
                  </td>
                  <td className="px-5 py-3 text-right text-slate-500 font-mono text-xs">
                    {Number(line.holidayPay) > 0 ? fmt(Number(line.holidayPay)) : "—"}
                  </td>
                  <td className="px-5 py-3 text-right text-slate-500 font-mono text-xs">
                    {Number(line.overtimePay) > 0 ? fmt(Number(line.overtimePay)) : "—"}
                  </td>
                  <td className="px-5 py-3 text-right text-slate-700 font-mono text-xs font-medium">
                    {fmt(Number(line.grossPay))}
                  </td>
                  <td className="px-5 py-3 text-right text-red-500 font-mono text-xs">
                    -{fmt(Number(line.totalDeductions))}
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-indigo-700 font-mono text-sm">
                    {fmt(Number(line.netPay))}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <a
                      href={`/api/admin/hr/payroll/${id}/payslip/${line.id}`}
                      download
                      className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium border border-indigo-200 rounded px-2 py-1 hover:bg-indigo-50"
                    >
                      <Download className="h-3 w-3" /> PDF
                    </a>
                  </td>
                  {isDraft && (
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => setEditLine(line)}
                        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 font-medium border border-slate-200 rounded px-2 py-1 hover:bg-indigo-50 hover:border-indigo-200"
                      >
                        <Edit2 className="h-3 w-3" /> Edit
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Deductions Breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">Deductions Breakdown</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <th className="px-5 py-3 text-left">Employee</th>
                <th className="px-5 py-3 text-right">Absent/Late</th>
                <th className="px-5 py-3 text-right">SSS</th>
                <th className="px-5 py-3 text-right">PhilHealth</th>
                <th className="px-5 py-3 text-right">Pag-IBIG</th>
                <th className="px-5 py-3 text-right">W/Tax</th>
                <th className="px-5 py-3 text-right">Other</th>
                <th className="px-5 py-3 text-right font-semibold text-red-500">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {run.lines.map((line) => {
                const absentLate = Number(line.absenceDeduction) + Number(line.lateDeduction);
                return (
                  <tr key={line.id} className="hover:bg-slate-50 text-xs">
                    <td className="px-5 py-2 text-slate-700 font-medium">
                      {line.employee.lastName}, {line.employee.firstName}
                    </td>
                    <td className="px-5 py-2 text-right font-mono text-slate-600">
                      {absentLate > 0 ? fmt(absentLate) : "—"}
                    </td>
                    <td className="px-5 py-2 text-right font-mono text-slate-600">
                      {fmt(Number(line.sssEmployee))}
                    </td>
                    <td className="px-5 py-2 text-right font-mono text-slate-600">
                      {fmt(Number(line.philhealthEmployee))}
                    </td>
                    <td className="px-5 py-2 text-right font-mono text-slate-600">
                      {fmt(Number(line.pagibigEmployee))}
                    </td>
                    <td className="px-5 py-2 text-right font-mono text-slate-600">
                      {fmt(Number(line.withholdingTax))}
                    </td>
                    <td className="px-5 py-2 text-right font-mono text-slate-500">
                      {Number(line.otherDeductions) > 0 ? fmt(Number(line.otherDeductions)) : "—"}
                    </td>
                    <td className="px-5 py-2 text-right font-mono font-semibold text-red-500">
                      {fmt(Number(line.totalDeductions))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Government Remittance Summary */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">Gov&apos;t Remittance Summary</h2>
            <p className="text-xs text-slate-400 mt-0.5">Total employer + employee contributions to remit</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100">
            {[
              {
                label: "SSS",
                emp:   run.lines.reduce((s, l) => s + Number(l.sssEmployee), 0),
                er:    run.lines.reduce((s, l) => s + Number((l as unknown as Record<string,number>).sssEmployer ?? 0), 0),
                color: "text-blue-600",
              },
              {
                label: "PhilHealth",
                emp:   run.lines.reduce((s, l) => s + Number(l.philhealthEmployee), 0),
                er:    run.lines.reduce((s, l) => s + Number((l as unknown as Record<string,number>).philhealthEmployer ?? 0), 0),
                color: "text-green-600",
              },
              {
                label: "Pag-IBIG",
                emp:   run.lines.reduce((s, l) => s + Number(l.pagibigEmployee), 0),
                er:    run.lines.reduce((s, l) => s + Number((l as unknown as Record<string,number>).pagibigEmployer ?? 0), 0),
                color: "text-amber-600",
              },
              {
                label: "BIR W/Tax",
                emp:   run.lines.reduce((s, l) => s + Number(l.withholdingTax), 0),
                er:    0,
                color: "text-red-600",
              },
            ].map(({ label, emp, er, color }) => (
              <div key={label} className="px-5 py-4">
                <p className={`text-xs font-semibold ${color} mb-2`}>{label}</p>
                <p className="text-xs text-slate-400">Employee</p>
                <p className="text-sm font-bold text-slate-800">{fmt(emp)}</p>
                {er > 0 && (
                  <>
                    <p className="text-xs text-slate-400 mt-1">Employer</p>
                    <p className="text-sm font-semibold text-slate-600">{fmt(er)}</p>
                    <p className="text-xs text-slate-400 mt-1 border-t pt-1">Total Remit</p>
                    <p className="text-sm font-bold text-slate-900">{fmt(emp + er)}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
