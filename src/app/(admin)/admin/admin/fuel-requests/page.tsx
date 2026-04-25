"use client";

import { useState, useEffect, useCallback } from "react";
import { Car, Fuel, Wrench, Loader2, Pencil, X, Check, Clock, ChevronDown } from "lucide-react";

type Tab = "fuel" | "maintenance";

type VLog = {
  id: string;
  plateNumber: string;
  vehicleType: string;
  logType: string;
  logDate: string | null;
  description: string | null;
  liters: number | null;
  pricePerLiter: number | null;
  totalAmount: number | null;
  status: string;
  performedBy: string | null;
  lastEditedBy: string | null;
  lastEditedAt: string | null;
  createdAt: string;
};

const FIELD = "border border-slate-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 w-full";

const STATUS_OPTS = ["PENDING", "COMPLETED", "CANCELLED"];
const STATUS_STYLE: Record<string, string> = {
  PENDING:   "bg-amber-50 text-amber-700 border-amber-200",
  COMPLETED: "bg-green-50 text-green-700 border-green-200",
  CANCELLED: "bg-slate-100 text-slate-500 border-slate-200",
};

const today = () => new Date().toISOString().split("T")[0];

export default function VehicleMaintenancePage() {
  const [tab, setTab]           = useState<Tab>("fuel");
  const [logs, setLogs]         = useState<VLog[]>([]);
  const [loading, setLoading]   = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch(`/api/admin/dept/vehicle-logs?logType=${tab === "fuel" ? "FUEL" : "MAINTENANCE"}`);
    const json = await res.json();
    if (json.success) setLogs(json.data);
    setLoading(false);
  }, [tab]);

  useEffect(() => { load(); setEditingId(null); setError(null); }, [load]);

  const startEdit = (log: VLog) => {
    setEditingId(log.id);
    if (tab === "fuel") {
      setEditForm({
        plateNumber:   log.plateNumber,
        vehicleType:   log.vehicleType,
        logDate:       log.logDate?.split("T")[0] ?? today(),
        pricePerLiter: log.pricePerLiter?.toString() ?? "",
        liters:        log.liters?.toString() ?? "",
        totalAmount:   log.totalAmount?.toString() ?? "",
        status:        log.status,
        performedBy:   log.performedBy ?? "",
      });
    } else {
      setEditForm({
        plateNumber: log.plateNumber,
        vehicleType: log.vehicleType,
        logDate:     log.logDate?.split("T")[0] ?? today(),
        description: log.description ?? "",
        status:      log.status,
      });
    }
    setError(null);
  };

  const setEF = (k: string, v: string) => setEditForm((p) => {
    const next = { ...p, [k]: v };
    if ((k === "liters" || k === "pricePerLiter") && tab === "fuel") {
      const l = parseFloat(k === "liters" ? v : p.liters || "0") || 0;
      const pp = parseFloat(k === "pricePerLiter" ? v : p.pricePerLiter || "0") || 0;
      next.totalAmount = (l * pp).toFixed(2);
    }
    return next;
  });

  const saveEdit = async () => {
    setSaving(true); setError(null);
    try {
      const body = tab === "fuel"
        ? { plateNumber: editForm.plateNumber, vehicleType: editForm.vehicleType, logType: "FUEL", logDate: editForm.logDate || undefined, pricePerLiter: parseFloat(editForm.pricePerLiter) || undefined, liters: parseFloat(editForm.liters) || undefined, totalAmount: parseFloat(editForm.totalAmount) || undefined, status: editForm.status, performedBy: editForm.performedBy || undefined }
        : { plateNumber: editForm.plateNumber, vehicleType: editForm.vehicleType, logType: "MAINTENANCE", logDate: editForm.logDate || undefined, description: editForm.description || undefined, status: editForm.status };
      const res  = await fetch(`/api/admin/dept/vehicle-logs?id=${editingId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setEditingId(null);
      load();
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to save"); }
    finally { setSaving(false); }
  };

  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }) : "—";
  const fmtAmt  = (n: number | null) => n != null ? `₱${Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2 })}` : "—";
  const fmtNum  = (n: number | null) => n != null ? Number(n).toLocaleString() : "—";
  const fmtTs   = (s: string | null) => s ? new Date(s).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : null;

  return (
    <div className="p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-yellow-500 flex items-center justify-center shrink-0">
          <Car className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Vehicle Fuel &amp; Maintenance</h1>
          <p className="text-sm text-slate-500">Fuel consumption logs and maintenance records</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {([["fuel", "Fuel Logs", Fuel], ["maintenance", "Maintenance Logs", Wrench]] as const).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      {/* Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">{logs.length} {tab === "fuel" ? "fuel" : "maintenance"} record{logs.length !== 1 ? "s" : ""}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-indigo-400" /></div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8"><p className="text-sm text-slate-400">No {tab === "fuel" ? "fuel" : "maintenance"} logs yet.</p></div>
        ) : (
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {tab === "fuel" ? (
                    <>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Vehicle</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Plate</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Date</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">₱/L</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">Liters</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">Total</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Driver</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Status</th>
                      <th className="px-4 py-3 w-20" />
                    </>
                  ) : (
                    <>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Vehicle</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Plate</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Date</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Particulars</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Status</th>
                      <th className="px-4 py-3 w-20" />
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => {
                  const isEditing = editingId === log.id;
                  return (
                    <tr key={log.id} className={`hover:bg-slate-50 transition-colors ${isEditing ? "bg-indigo-50/40" : ""}`}>
                      {isEditing ? (
                        tab === "fuel" ? (
                          <>
                            <td className="px-2 py-2"><input className={FIELD} value={editForm.vehicleType} onChange={e => setEF("vehicleType", e.target.value)} /></td>
                            <td className="px-2 py-2"><input className={FIELD} value={editForm.plateNumber} onChange={e => setEF("plateNumber", e.target.value)} /></td>
                            <td className="px-2 py-2"><input type="date" className={FIELD} value={editForm.logDate} onChange={e => setEF("logDate", e.target.value)} /></td>
                            <td className="px-2 py-2"><input type="number" step="0.01" className={FIELD} value={editForm.pricePerLiter} onChange={e => setEF("pricePerLiter", e.target.value)} /></td>
                            <td className="px-2 py-2"><input type="number" step="0.01" className={FIELD} value={editForm.liters} onChange={e => setEF("liters", e.target.value)} /></td>
                            <td className="px-2 py-2"><input type="number" step="0.01" className={FIELD} value={editForm.totalAmount} onChange={e => setEF("totalAmount", e.target.value)} /></td>
                            <td className="px-2 py-2"><input className={FIELD} value={editForm.performedBy} onChange={e => setEF("performedBy", e.target.value)} /></td>
                            <td className="px-2 py-2"><div className="relative"><select className={FIELD + " appearance-none pr-6"} value={editForm.status} onChange={e => setEF("status", e.target.value)}>{STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}</select><ChevronDown className="absolute right-1.5 top-2 h-3 w-3 text-slate-400 pointer-events-none" /></div></td>
                            <td className="px-2 py-2">
                              <div className="flex gap-1">
                                <button onClick={saveEdit} disabled={saving} className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">{saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}</button>
                                <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="h-3.5 w-3.5" /></button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-2 py-2"><input className={FIELD} value={editForm.vehicleType} onChange={e => setEF("vehicleType", e.target.value)} /></td>
                            <td className="px-2 py-2"><input className={FIELD} value={editForm.plateNumber} onChange={e => setEF("plateNumber", e.target.value)} /></td>
                            <td className="px-2 py-2"><input type="date" className={FIELD} value={editForm.logDate} onChange={e => setEF("logDate", e.target.value)} /></td>
                            <td className="px-2 py-2"><input className={FIELD} value={editForm.description} onChange={e => setEF("description", e.target.value)} /></td>
                            <td className="px-2 py-2"><div className="relative"><select className={FIELD + " appearance-none pr-6"} value={editForm.status} onChange={e => setEF("status", e.target.value)}>{STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}</select><ChevronDown className="absolute right-1.5 top-2 h-3 w-3 text-slate-400 pointer-events-none" /></div></td>
                            <td className="px-2 py-2">
                              <div className="flex gap-1">
                                <button onClick={saveEdit} disabled={saving} className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">{saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}</button>
                                <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="h-3.5 w-3.5" /></button>
                              </div>
                            </td>
                          </>
                        )
                      ) : (
                        tab === "fuel" ? (
                          <>
                            <td className="px-4 py-3 font-medium text-slate-900">{log.vehicleType}</td>
                            <td className="px-4 py-3 text-slate-600">{log.plateNumber}</td>
                            <td className="px-4 py-3 text-slate-500">{fmtDate(log.logDate)}</td>
                            <td className="px-4 py-3 text-right text-slate-600">{log.pricePerLiter ? `₱${Number(log.pricePerLiter).toFixed(2)}` : "—"}</td>
                            <td className="px-4 py-3 text-right text-slate-600">{fmtNum(log.liters)}L</td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-900">{fmtAmt(log.totalAmount)}</td>
                            <td className="px-4 py-3 text-slate-500">{log.performedBy ?? "—"}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${STATUS_STYLE[log.status] ?? STATUS_STYLE.PENDING}`}>
                                <Clock className="h-3 w-3" />{log.status.charAt(0)+log.status.slice(1).toLowerCase()}
                              </span>
                              {log.lastEditedBy && <p className="text-xs text-slate-400 mt-0.5">by {log.lastEditedBy} · {fmtTs(log.lastEditedAt)}</p>}
                            </td>
                            <td className="px-4 py-3"><button onClick={() => startEdit(log)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"><Pencil className="h-3.5 w-3.5" /></button></td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 font-medium text-slate-900">{log.vehicleType}</td>
                            <td className="px-4 py-3 text-slate-600">{log.plateNumber}</td>
                            <td className="px-4 py-3 text-slate-500">{fmtDate(log.logDate)}</td>
                            <td className="px-4 py-3 text-slate-700">{log.description ?? "—"}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${STATUS_STYLE[log.status] ?? STATUS_STYLE.PENDING}`}>
                                <Clock className="h-3 w-3" />{log.status.charAt(0)+log.status.slice(1).toLowerCase()}
                              </span>
                              {log.lastEditedBy && <p className="text-xs text-slate-400 mt-0.5">by {log.lastEditedBy} · {fmtTs(log.lastEditedAt)}</p>}
                            </td>
                            <td className="px-4 py-3"><button onClick={() => startEdit(log)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"><Pencil className="h-3.5 w-3.5" /></button></td>
                          </>
                        )
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
