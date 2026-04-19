"use client";

import { useState, useEffect, useCallback } from "react";
import { Wrench, Plus, Loader2, Pencil, X, Check, Clock, ChevronDown } from "lucide-react";

type RepairLog = {
  id: string;
  itemName: string;
  itemType: string | null;
  dateReported: string;
  dateResolved: string | null;
  description: string;
  status: string;
  cost: number | null;
  technician: string | null;
  notes: string | null;
  lastEditedBy: string | null;
  lastEditedAt: string | null;
};

const FIELD = "border border-slate-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 w-full";

const STATUS_OPTS = ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
const STATUS_STYLE: Record<string, string> = {
  PENDING:     "bg-amber-50 text-amber-700 border-amber-200",
  IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200",
  COMPLETED:   "bg-green-50 text-green-700 border-green-200",
  CANCELLED:   "bg-slate-100 text-slate-500 border-slate-200",
};

const today = () => new Date().toISOString().split("T")[0];
const emptyForm = () => ({ itemName: "", itemType: "", dateReported: today(), dateResolved: "", description: "", status: "PENDING", cost: "", technician: "", notes: "" });

export default function RepairLogsPage() {
  const [logs, setLogs]           = useState<RepairLog[]>([]);
  const [loading, setLoading]     = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm]   = useState<Record<string, string>>({});
  const [saving, setSaving]       = useState(false);
  const [showAdd, setShowAdd]     = useState(false);
  const [addForm, setAddForm]     = useState<Record<string, string>>(emptyForm());
  const [addSaving, setAddSaving] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch("/api/admin/dept/repair-logs");
    const json = await res.json();
    if (json.success) setLogs(json.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const startEdit = (log: RepairLog) => {
    setEditingId(log.id);
    setEditForm({ itemName: log.itemName, itemType: log.itemType ?? "", dateReported: log.dateReported.split("T")[0], dateResolved: log.dateResolved?.split("T")[0] ?? "", description: log.description, status: log.status, cost: log.cost?.toString() ?? "", technician: log.technician ?? "", notes: log.notes ?? "" });
    setError(null);
  };

  const setEF = (k: string, v: string) => setEditForm((p) => ({ ...p, [k]: v }));
  const setAF = (k: string, v: string) => setAddForm((p) => ({ ...p, [k]: v }));

  const saveEdit = async () => {
    setSaving(true); setError(null);
    try {
      const body = { itemName: editForm.itemName, itemType: editForm.itemType || undefined, dateReported: editForm.dateReported, dateResolved: editForm.dateResolved || undefined, description: editForm.description, status: editForm.status, cost: editForm.cost ? parseFloat(editForm.cost) : undefined, technician: editForm.technician || undefined, notes: editForm.notes || undefined };
      const res  = await fetch(`/api/admin/dept/repair-logs?id=${editingId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setEditingId(null); load();
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to save"); }
    finally { setSaving(false); }
  };

  const saveAdd = async () => {
    setAddSaving(true); setError(null);
    try {
      if (!addForm.itemName || !addForm.description) throw new Error("Item name and description are required.");
      const body = { itemName: addForm.itemName, itemType: addForm.itemType || undefined, dateReported: addForm.dateReported, dateResolved: addForm.dateResolved || undefined, description: addForm.description, status: addForm.status, cost: addForm.cost ? parseFloat(addForm.cost) : undefined, technician: addForm.technician || undefined, notes: addForm.notes || undefined };
      const res  = await fetch("/api/admin/dept/repair-logs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setShowAdd(false); setAddForm(emptyForm()); load();
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to save"); }
    finally { setAddSaving(false); }
  };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
  const fmtTs   = (s: string | null) => s ? new Date(s).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : null;

  return (
    <div className="p-6 max-w-7xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-red-500 flex items-center justify-center shrink-0">
          <Wrench className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Repair Logs</h1>
          <p className="text-sm text-slate-500">Track repair requests, progress, and resolution</p>
        </div>
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      {showAdd && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-semibold text-slate-700">New Repair Log</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <div className="col-span-2"><label className="text-xs text-slate-500 mb-1 block">Item Name *</label><input className={FIELD} placeholder="e.g. Aircon Unit" value={addForm.itemName} onChange={e => setAF("itemName", e.target.value)} /></div>
            <div><label className="text-xs text-slate-500 mb-1 block">Item Type</label><input className={FIELD} placeholder="e.g. Appliance" value={addForm.itemType} onChange={e => setAF("itemType", e.target.value)} /></div>
            <div><label className="text-xs text-slate-500 mb-1 block">Date Reported</label><input type="date" className={FIELD} value={addForm.dateReported} onChange={e => setAF("dateReported", e.target.value)} /></div>
            <div className="col-span-2 sm:col-span-3"><label className="text-xs text-slate-500 mb-1 block">Description *</label><input className={FIELD} placeholder="Describe the issue" value={addForm.description} onChange={e => setAF("description", e.target.value)} /></div>
            <div><label className="text-xs text-slate-500 mb-1 block">Technician</label><input className={FIELD} value={addForm.technician} onChange={e => setAF("technician", e.target.value)} /></div>
            <div><label className="text-xs text-slate-500 mb-1 block">Cost (₱)</label><input type="number" min="0" step="0.01" className={FIELD} value={addForm.cost} onChange={e => setAF("cost", e.target.value)} /></div>
            <div><label className="text-xs text-slate-500 mb-1 block">Date Resolved</label><input type="date" className={FIELD} value={addForm.dateResolved} onChange={e => setAF("dateResolved", e.target.value)} /></div>
            <div><label className="text-xs text-slate-500 mb-1 block">Status</label>
              <div className="relative"><select className={FIELD + " appearance-none pr-7"} value={addForm.status} onChange={e => setAF("status", e.target.value)}>{STATUS_OPTS.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</select><ChevronDown className="absolute right-2 top-2 h-3.5 w-3.5 text-slate-400 pointer-events-none" /></div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={saveAdd} disabled={addSaving} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50">{addSaving && <Loader2 className="h-3 w-3 animate-spin" />}Save</button>
            <button onClick={() => { setShowAdd(false); setError(null); }} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">{logs.length} log{logs.length !== 1 ? "s" : ""}</p>
          {!showAdd && (
            <button onClick={() => { setShowAdd(true); setAddForm(emptyForm()); setError(null); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700">
              <Plus className="h-4 w-4" /> Log Repair
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-indigo-400" /></div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8"><p className="text-sm text-slate-400">No repair logs yet.</p></div>
        ) : (
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Item</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Description</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Reported</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Resolved</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Technician</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">Cost</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Status</th>
                  <th className="px-4 py-3 w-16" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => {
                  const isEditing = editingId === log.id;
                  return (
                    <tr key={log.id} className={`hover:bg-slate-50 transition-colors ${isEditing ? "bg-indigo-50/40" : ""}`}>
                      {isEditing ? (
                        <>
                          <td className="px-2 py-2"><input className={FIELD} value={editForm.itemName} onChange={e => setEF("itemName", e.target.value)} /></td>
                          <td className="px-2 py-2"><input className={FIELD} value={editForm.itemType} onChange={e => setEF("itemType", e.target.value)} /></td>
                          <td className="px-2 py-2"><input className={FIELD} value={editForm.description} onChange={e => setEF("description", e.target.value)} /></td>
                          <td className="px-2 py-2"><input type="date" className={FIELD} value={editForm.dateReported} onChange={e => setEF("dateReported", e.target.value)} /></td>
                          <td className="px-2 py-2"><input type="date" className={FIELD} value={editForm.dateResolved} onChange={e => setEF("dateResolved", e.target.value)} /></td>
                          <td className="px-2 py-2"><input className={FIELD} value={editForm.technician} onChange={e => setEF("technician", e.target.value)} /></td>
                          <td className="px-2 py-2"><input type="number" step="0.01" className={FIELD} value={editForm.cost} onChange={e => setEF("cost", e.target.value)} /></td>
                          <td className="px-2 py-2"><div className="relative"><select className={FIELD + " appearance-none pr-6"} value={editForm.status} onChange={e => setEF("status", e.target.value)}>{STATUS_OPTS.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</select><ChevronDown className="absolute right-1.5 top-2 h-3 w-3 text-slate-400 pointer-events-none" /></div></td>
                          <td className="px-2 py-2">
                            <div className="flex gap-1">
                              <button onClick={saveEdit} disabled={saving} className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">{saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}</button>
                              <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="h-3.5 w-3.5" /></button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 font-medium text-slate-900">{log.itemName}</td>
                          <td className="px-4 py-3 text-slate-500">{log.itemType ?? "—"}</td>
                          <td className="px-4 py-3 text-slate-700 max-w-xs truncate">{log.description}</td>
                          <td className="px-4 py-3 text-slate-500">{fmtDate(log.dateReported)}</td>
                          <td className="px-4 py-3 text-slate-500">{log.dateResolved ? fmtDate(log.dateResolved) : "—"}</td>
                          <td className="px-4 py-3 text-slate-500">{log.technician ?? "—"}</td>
                          <td className="px-4 py-3 text-right font-medium text-slate-900">{log.cost != null ? `₱${Number(log.cost).toLocaleString("en-PH", { minimumFractionDigits: 2 })}` : "—"}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${STATUS_STYLE[log.status] ?? STATUS_STYLE.PENDING}`}>
                              <Clock className="h-3 w-3" />{log.status.replace("_", " ")}
                            </span>
                            {log.lastEditedBy && <p className="text-xs text-slate-400 mt-0.5">by {log.lastEditedBy} · {fmtTs(log.lastEditedAt)}</p>}
                          </td>
                          <td className="px-4 py-3"><button onClick={() => startEdit(log)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"><Pencil className="h-3.5 w-3.5" /></button></td>
                        </>
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
