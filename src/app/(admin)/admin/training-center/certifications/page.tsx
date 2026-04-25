"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Award, Search, Loader2, CheckCircle2, AlertTriangle,
  XCircle, ChevronDown,
} from "lucide-react";

type Participant = {
  studentId: string;
  name: string;
  email: string;
  course: { id: string; title: string } | null;
  schedule: { id: string; name: string } | null;
  presentCount: number;
  totalSessions: number;
  attendancePct: number | null;
  isEligible: boolean;
  certificate: { id: string; certNumber: string; issuedAt: string } | null;
  status: "issued" | "eligible" | "not_eligible";
};

type Totals = { all: number; issued: number; eligible: number; not_eligible: number };

const STATUS_TABS = [
  { key: "all",         label: "All",           icon: ChevronDown,    color: "text-slate-600" },
  { key: "issued",      label: "Cert Issued",   icon: Award,          color: "text-yellow-600" },
  { key: "eligible",    label: "Eligible",      icon: CheckCircle2,   color: "text-emerald-600" },
  { key: "not_eligible",label: "Not Eligible",  icon: AlertTriangle,  color: "text-amber-600" },
] as const;

export default function CertificationsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [totals, setTotals] = useState<Totals>({ all: 0, issued: 0, eligible: 0, not_eligible: 0 });
  const [certThreshold, setCertThreshold] = useState(75);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [issuing, setIssuing] = useState<string | null>(null);
  const [issueError, setIssueError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ status: statusFilter });
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin/training-center/certifications?${params}`).then((r) => r.json());
    if (res.success) {
      setParticipants(res.data.participants);
      setTotals(res.data.totals);
      setCertThreshold(res.data.certThreshold);
    }
    setLoading(false);
  }, [statusFilter, search]);

  useEffect(() => { void load(); }, [load]);

  const issueCert = async (studentId: string, courseId: string) => {
    setIssuing(studentId);
    setIssueError(null);
    try {
      const res = await fetch("/api/admin/training-center/certifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, courseId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to issue certificate");
      await load();
    } catch (e) {
      setIssueError(e instanceof Error ? e.message : "Error");
    } finally {
      setIssuing(null);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Certifications</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Issue certificates to students who have met the {certThreshold}% attendance threshold
        </p>
      </div>

      {issueError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 flex items-center gap-2">
          <XCircle className="h-4 w-4 shrink-0" /> {issueError}
        </div>
      )}

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border transition-colors ${
              statusFilter === tab.key
                ? "bg-indigo-600 text-white border-indigo-600"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
            <span className={`ml-0.5 font-bold ${statusFilter === tab.key ? "text-indigo-200" : "text-slate-400"}`}>
              {totals[tab.key as keyof Totals] ?? totals.all}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name…"
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : participants.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <Award className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No participants in this category</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Student", "Course / Batch", "Attendance", "Certificate"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {participants.map((p) => {
                const pct = p.attendancePct;
                return (
                  <tr key={p.studentId} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{p.name}</p>
                      <p className="text-xs text-slate-400">{p.email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <p className="text-slate-700">{p.course?.title ?? "—"}</p>
                      {p.schedule && <p className="text-slate-400 mt-0.5">{p.schedule.name}</p>}
                    </td>
                    <td className="px-4 py-3">
                      {pct === null ? (
                        <span className="text-xs text-slate-400">No data</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${pct >= certThreshold ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-red-400"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className={`text-xs font-semibold tabular-nums ${pct >= certThreshold ? "text-emerald-700" : pct >= 50 ? "text-amber-700" : "text-red-700"}`}>
                            {pct}%
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {p.presentCount}/{p.totalSessions}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {p.certificate ? (
                        <div>
                          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                            <Award className="h-3.5 w-3.5" /> Issued
                          </span>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(p.certificate.issuedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                          <p className="text-[10px] text-slate-300 font-mono truncate max-w-[120px]">
                            #{p.certificate.certNumber.slice(0, 12)}…
                          </p>
                        </div>
                      ) : p.isEligible ? (
                        <button
                          onClick={() => p.course && void issueCert(p.studentId, p.course.id)}
                          disabled={issuing === p.studentId || !p.course}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl transition-colors"
                        >
                          {issuing === p.studentId ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Award className="h-3.5 w-3.5" />
                          )}
                          Issue Certificate
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Below {certThreshold}%
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-4 py-2.5 border-t border-slate-100 text-xs text-slate-400">
            Showing {participants.length} participants
          </div>
        </div>
      )}
    </div>
  );
}
