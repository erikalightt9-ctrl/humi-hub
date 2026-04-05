"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertCircle, Shield, Play } from "lucide-react";

interface AuditLog {
  id: string;
  createdAt: string;
  entityType: string;
  entityId: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "VOID" | "POST";
  performedByName: string;
  performedByRole: string;
}

interface ForensicFlag {
  id: string;
  ruleCode: string;
  entityType: string;
  entityId: string;
  description: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  isResolved: boolean;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-blue-100 text-blue-700",
  UPDATE: "bg-amber-100 text-amber-700",
  DELETE: "bg-red-100 text-red-700",
  VOID: "bg-red-100 text-red-700",
  POST: "bg-emerald-100 text-emerald-700",
};

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-700",
  HIGH: "bg-orange-100 text-orange-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  LOW: "bg-blue-100 text-blue-700",
};

const fmtDate = (d: string) => new Date(d).toLocaleString("en-PH");

type TabType = "logs" | "flags";

export default function AuditPage() {
  const [tab, setTab] = useState<TabType>("logs");
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [flags, setFlags] = useState<ForensicFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUnresolvedOnly, setShowUnresolvedOnly] = useState(true);
  const [running, setRunning] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState<string | null>(null);
  const [resolveNote, setResolveNote] = useState("");
  const [resolving, setResolving] = useState(false);

  const loadLogs = async () => {
    try {
      const res = await fetch("/api/admin/accounting/audit-logs");
      if (!res.ok) throw new Error("Failed to load audit logs");
      const d = await res.json();
      setLogs(d.data ?? d ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  };

  const loadFlags = async () => {
    try {
      const url = showUnresolvedOnly
        ? "/api/admin/accounting/forensic-flags?isResolved=false"
        : "/api/admin/accounting/forensic-flags";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load forensic flags");
      const d = await res.json();
      setFlags(d.data ?? d ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    const load = async () => {
      if (tab === "logs") await loadLogs();
      else await loadFlags();
      setLoading(false);
    };
    load();
  }, [tab, showUnresolvedOnly]);

  const handleRunChecks = async () => {
    setRunning(true);
    try {
      const res = await fetch("/api/admin/accounting/forensic-flags/run", { method: "POST" });
      if (!res.ok) throw new Error("Failed to run checks");
      await loadFlags();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error");
    } finally {
      setRunning(false);
    }
  };

  const handleResolve = async () => {
    if (!showResolveModal) return;
    setResolving(true);
    try {
      const res = await fetch(`/api/admin/accounting/forensic-flags/${showResolveModal}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: resolveNote }),
      });
      if (!res.ok) throw new Error("Failed to resolve flag");
      setShowResolveModal(null);
      setResolveNote("");
      await loadFlags();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error");
    } finally {
      setResolving(false);
    }
  };

  const severityCounts = flags.reduce((acc, f) => {
    acc[f.severity] = (acc[f.severity] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Audit & Forensic</h1>
          <p className="text-sm text-slate-500 mt-1">Activity logs and fraud detection flags</p>
        </div>
        {tab === "flags" && (
          <button onClick={handleRunChecks} disabled={running}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Run All Checks
          </button>
        )}
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 border-b border-slate-200">
        {([["logs", "Audit Logs"], ["flags", "Forensic Flags"]] as [TabType, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === key ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0" /><span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 text-emerald-600 animate-spin" />
        </div>
      ) : tab === "logs" ? (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date/Time</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Entity Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Entity ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Performed By</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">No audit logs found</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500 text-xs">{fmtDate(log.createdAt)}</td>
                    <td className="px-4 py-3 text-slate-700">{log.entityType}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{log.entityId.slice(0, 8)}…</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_COLORS[log.action] ?? "bg-slate-100 text-slate-600"}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-800">{log.performedByName}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{log.performedByRole}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Severity Summary */}
          <div className="grid grid-cols-4 gap-3">
            {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((sev) => (
              <div key={sev} className={`rounded-xl p-4 border ${sev === "CRITICAL" ? "bg-red-50 border-red-200" : sev === "HIGH" ? "bg-orange-50 border-orange-200" : sev === "MEDIUM" ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-200"}`}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">{sev}</p>
                <p className={`text-2xl font-bold ${SEVERITY_COLORS[sev].split(" ")[1]}`}>{severityCounts[sev] ?? 0}</p>
              </div>
            ))}
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={showUnresolvedOnly}
                onChange={(e) => setShowUnresolvedOnly(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              Show unresolved only
            </label>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Rule</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Entity</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Description</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Severity</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {flags.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center">
                      <Shield className="h-8 w-8 text-emerald-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">No forensic flags found</p>
                    </td>
                  </tr>
                ) : (
                  flags.map((flag) => (
                    <tr key={flag.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{flag.ruleCode}</td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{flag.entityType}</td>
                      <td className="px-4 py-3 text-slate-800 max-w-xs truncate">{flag.description}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEVERITY_COLORS[flag.severity]}`}>
                          {flag.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${flag.isResolved ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                          {flag.isResolved ? "Resolved" : "Open"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {!flag.isResolved && (
                          <button
                            onClick={() => setShowResolveModal(flag.id)}
                            className="text-xs text-emerald-600 hover:underline"
                          >
                            Resolve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl space-y-4">
            <h3 className="text-base font-semibold text-slate-900">Resolve Forensic Flag</h3>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Resolution Note</label>
              <textarea className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                rows={3} value={resolveNote} onChange={(e) => setResolveNote(e.target.value)} placeholder="Describe how this was resolved..." />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setShowResolveModal(null); setResolveNote(""); }}
                className="px-4 py-2 text-sm border border-slate-300 rounded-lg text-slate-600">Cancel</button>
              <button onClick={handleResolve} disabled={resolving}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                {resolving && <Loader2 className="h-3 w-3 animate-spin" />}Mark Resolved
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
