"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CheckSquare, Plus, Search, Loader2, X, Trash2,
  AlertTriangle, ChevronDown, Clock, User,
} from "lucide-react";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate: string | null;
  assigneeName: string | null;
  assigneeId: string | null;
  startedAt: string | null;
  completedAt: string | null;
  timeSpentMinutes: number | null;
  createdAt: string;
};

type Employee = { id: string; name: string; department: string | null };

const STATUS_CONFIG = {
  TODO:        { label: "To Do",       cls: "bg-slate-100 text-slate-600",   border: "border-slate-200" },
  IN_PROGRESS: { label: "In Progress", cls: "bg-indigo-100 text-indigo-700", border: "border-indigo-200" },
  DONE:        { label: "Done",        cls: "bg-emerald-100 text-emerald-700", border: "border-emerald-200" },
  BLOCKED:     { label: "Blocked",     cls: "bg-red-100 text-red-700",       border: "border-red-200" },
} as const;

const PRIORITY_CONFIG = {
  HIGH:   { label: "High",   cls: "bg-red-100 text-red-700"    },
  MEDIUM: { label: "Medium", cls: "bg-amber-100 text-amber-700" },
  LOW:    { label: "Low",    cls: "bg-slate-100 text-slate-500" },
} as const;

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const EMPTY_FORM = {
  title: "", description: "", status: "TODO" as Task["status"],
  priority: "MEDIUM" as Task["priority"], dueDate: "", assigneeName: "", assigneeId: "",
};

export default function AdminWorkPage() {
  const [tasks, setTasks]         = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (search) params.set("search", search);
    const [taskRes, empRes] = await Promise.all([
      fetch(`/api/admin/tasks?${params}`).then((r) => r.json()),
      fetch("/api/admin/hr/employees?limit=200").then((r) => r.json()),
    ]);
    if (taskRes.success) setTasks(taskRes.data);
    if (empRes.success) {
      const emps = empRes.data?.employees ?? empRes.data ?? [];
      setEmployees(emps.map((e: { id: string; firstName: string; lastName: string; department: string | null }) => ({
        id: e.id,
        name: `${e.firstName} ${e.lastName}`,
        department: e.department,
      })));
    }
    setLoading(false);
  }, [statusFilter, search]);

  useEffect(() => { void load(); }, [load]);

  const createTask = async () => {
    if (!form.title.trim()) { setFormError("Title is required"); return; }
    setSaving(true); setFormError(null);
    try {
      const res = await fetch("/api/admin/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description || null,
          status: form.status,
          priority: form.priority,
          dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
          assigneeName: form.assigneeName || null,
          assigneeId: form.assigneeId || null,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setShowModal(false);
      setForm(EMPTY_FORM);
      void load();
    } catch (e) { setFormError(e instanceof Error ? e.message : "Failed"); }
    finally { setSaving(false); }
  };

  const updateStatus = async (taskId: string, status: Task["status"]) => {
    setUpdatingId(taskId);
    try {
      await fetch(`/api/admin/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      void load();
    } finally { setUpdatingId(null); }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm("Delete this task?")) return;
    await fetch(`/api/admin/tasks/${taskId}`, { method: "DELETE" });
    void load();
  };

  const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white";

  const columns: Task["status"][] = ["TODO", "IN_PROGRESS", "BLOCKED", "DONE"];

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-indigo-600" /> Work Tracker
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Assign, track, and manage work across your team
          </p>
        </div>
        <button
          onClick={() => { setForm(EMPTY_FORM); setFormError(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl font-medium transition-colors"
        >
          <Plus className="h-4 w-4" /> New Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks…"
            className="pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white w-56"
          />
        </div>
        <div className="flex gap-1.5">
          {["", ...columns].map((s) => {
            const cfg = s ? STATUS_CONFIG[s as Task["status"]] : null;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 text-xs rounded-xl font-medium transition-colors ${
                  statusFilter === s
                    ? "bg-indigo-600 text-white"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {cfg?.label ?? "All"}
              </button>
            );
          })}
        </div>
      </div>

      {/* Kanban board */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col);
            const cfg = STATUS_CONFIG[col];
            return (
              <div key={col} className={`rounded-2xl border ${cfg.border} bg-white/60`}>
                <div className="px-3 py-2.5 border-b border-slate-100 flex items-center justify-between">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.cls}`}>
                    {cfg.label}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">{colTasks.length}</span>
                </div>
                <div className="p-2 space-y-2 min-h-[120px]">
                  {colTasks.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">No tasks</p>
                  ) : colTasks.map((task) => (
                    <div key={task.id} className="rounded-xl border border-slate-200 bg-white p-3 group">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-xs font-semibold text-slate-900 leading-snug flex-1">{task.title}</p>
                        <button
                          onClick={() => void deleteTask(task.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-red-600 text-slate-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {task.description && (
                        <p className="text-[11px] text-slate-500 mb-2 line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${PRIORITY_CONFIG[task.priority].cls}`}>
                          {PRIORITY_CONFIG[task.priority].label}
                        </span>
                        {task.assigneeName && (
                          <span className="flex items-center gap-0.5 text-[10px] text-slate-500">
                            <User className="h-3 w-3" />{task.assigneeName}
                          </span>
                        )}
                        {task.dueDate && (
                          <span className={`flex items-center gap-0.5 text-[10px] ${new Date(task.dueDate) < new Date() && task.status !== "DONE" ? "text-red-600 font-semibold" : "text-slate-400"}`}>
                            <Clock className="h-3 w-3" />
                            {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        )}
                        {task.timeSpentMinutes !== null && task.timeSpentMinutes > 0 && (
                          <span className="text-[10px] text-indigo-600">⏱ {formatDuration(task.timeSpentMinutes)}</span>
                        )}
                      </div>
                      {/* Status move buttons */}
                      <div className="flex gap-1 pt-1 border-t border-slate-100">
                        {columns.filter((c) => c !== col).map((nextStatus) => (
                          <button
                            key={nextStatus}
                            onClick={() => void updateStatus(task.id, nextStatus)}
                            disabled={updatingId === task.id}
                            className={`flex-1 text-[10px] py-1 rounded-lg transition-colors ${STATUS_CONFIG[nextStatus].cls} opacity-60 hover:opacity-100`}
                          >
                            {updatingId === task.id ? "…" : STATUS_CONFIG[nextStatus].label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Task Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">New Task</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              {formError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2 flex gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" /> {formError}
                </p>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Title *</label>
                <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="What needs to be done?" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description</label>
                <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Priority</label>
                  <select value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value as Task["priority"] }))} className={inputCls}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Status</label>
                  <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as Task["status"] }))} className={inputCls}>
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="BLOCKED">Blocked</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Assign To</label>
                <select
                  value={form.assigneeId}
                  onChange={(e) => {
                    const emp = employees.find((x) => x.id === e.target.value);
                    setForm((p) => ({ ...p, assigneeId: e.target.value, assigneeName: emp?.name ?? "" }));
                  }}
                  className={inputCls}
                >
                  <option value="">— Unassigned —</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name}{emp.department ? ` (${emp.department})` : ""}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Due Date</label>
                <input type="date" value={form.dueDate} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))} className={inputCls} />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <button onClick={() => setShowModal(false)} className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100">Cancel</button>
              <button
                onClick={createTask}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl font-medium"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving ? "Creating…" : "Create Task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
