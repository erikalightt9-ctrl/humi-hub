"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText, Download, Loader2, ChevronLeft, CheckCircle2, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface PayslipSummary {
  id:              string;
  payrollRunId:    string;
  runNumber:       string;
  periodStart:     string;
  periodEnd:       string;
  payDate:         string | null;
  status:          "APPROVED" | "PAID";
  grossPay:        number;
  totalDeductions: number;
  netPay:          number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function fmtPeso(n: number) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(n);
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function EmployeePayslipsPage() {
  const [payslips, setPayslips]       = useState<PayslipSummary[]>([]);
  const [loading, setLoading]         = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  const loadPayslips = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/employee/payslips");
      const json = await res.json() as { success: boolean; data: PayslipSummary[] };
      if (json.success) setPayslips(json.data);
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPayslips(); }, [loadPayslips]);

  async function handleDownload(lineId: string, runNumber: string) {
    setDownloading(lineId);
    try {
      const res = await fetch(`/api/employee/payslips/${lineId}/download`);
      if (!res.ok) return;
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `payslip-${runNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // non-fatal
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-lg mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center gap-2">
          <a href="/employee/attendance" className="text-gray-400 hover:text-gray-600">
            <ChevronLeft className="h-5 w-5" />
          </a>
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Payslips</h1>
            <p className="text-sm text-gray-500">Download your salary slips</p>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : payslips.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
            <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No payslips available yet</p>
            <p className="text-xs text-gray-400 mt-1">Payslips appear after payroll is approved</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payslips.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-gray-900 text-sm">{p.runNumber}</p>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                        p.status === "PAID"
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}>
                        {p.status === "PAID"
                          ? <CheckCircle2 className="h-2.5 w-2.5" />
                          : <Clock className="h-2.5 w-2.5" />}
                        {p.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {fmtDate(p.periodStart)} – {fmtDate(p.periodEnd)}
                    </p>
                    {p.payDate && (
                      <p className="text-xs text-gray-400 mt-0.5">Pay date: {fmtDate(p.payDate)}</p>
                    )}
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Gross</p>
                        <p className="text-xs font-medium text-gray-700">{fmtPeso(p.grossPay)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Deductions</p>
                        <p className="text-xs font-medium text-red-600">-{fmtPeso(p.totalDeductions)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Net Pay</p>
                        <p className="text-xs font-semibold text-green-700">{fmtPeso(p.netPay)}</p>
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    disabled={downloading === p.id}
                    onClick={() => handleDownload(p.id, p.runNumber)}
                  >
                    {downloading === p.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Download className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
