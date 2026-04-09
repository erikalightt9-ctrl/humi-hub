"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, AlertCircle, Plus, CheckSquare, Square, ClipboardList } from "lucide-react";

interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  isDone: boolean;
  deal: { id: string; title: string } | null;
}

interface Deal { id: string; title: string }

type FilterMode = "ALL" | "PENDING" | "DONE" | "OVERDUE";

const EMPTY_FORM = { title: "", description: "", dueDate: "", dealId: "" };

export default function TasksPage() {
  const [tasks, setTasks]         = useState<TaskItem[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [filter, setFilter]       = useState<FilterMode>("ALL");

  const [deals, setDeals]         = useState<Deal[]>([]);

  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState({ ...EMPTY_FORM });
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filter === "PENDING")  { params.set("isDone", "false"); }
      if (filter === "DONE")     { params.set("isDone", "true"); }
      if (filter === "OVERDUE")  { params.set("overdue", "true"); }
      params.set("limit", "100");
      const res  = await fetch(`/api/admin/sales/tasks?${params}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setTasks(json.data.data);
      setTotal(json.data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const loadDeals = useCallback(async () => {
    try {
      const res  = await fetch("/api/admin/sales/pipeline");
      const json = await res.json();
      if (json.success) setDeals(json.data ?? []);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadDeals(); }, [loadDeals]);

  const toggleTask = async (taskId: string, isDone: boolean) => {
    try {
      const res  = await fetch(`/api/admin/sales/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDone: !isDone }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update task");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const body = {
        title:       form.title,
        description: form.description || null,
        dueDate:     form.dueDate || null,
        dealId:      form.dealId || null,
      };
      const res  = await fetch("/api/admin/sales/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setShowForm(false);
      setForm({ ...EMPTY_FORM });
      load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to create task");
    } finally {
      setSaving(false);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isOverdue = (task: TaskItem) =>
    !task.isDone && task.dueDate !== null && new Date(task.dueDate) < today;

  const FILTER_OPTIONS: Array<{ value: FilterMode; label: string }> = [
    { value: "ALL",     label: "All" },
    { value: "PENDING", label: "Pending" },
    { value: "DONE",    label: "Done" },
    { value: "OVERDUE", label: "Overdue" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Tasks</h1>
          <p className="text-sm text-slate-500 mt-1">{total} tasks</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" /> New Task
        </button>
      </div>

      {/* New Task form */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-semibold text-slate-800 mb-4">New Task</h2>
          {formError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" /><span>{formError}</span>
            </div>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Title *</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Due Date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Linked Deal</label>
              <select
                value={form.dealId}
                onChange={(e) => setForm({ ...form, dealId: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">— None —</option>
                {deals.map((d) => (
                  <option key={d.id} value={d.id}>{d.title}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => { setShowForm(false); setForm({ ...EMPTY_FORM }); }}
                className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Create Task
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-1">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === opt.value
                ? "bg-indigo-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0" /><span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center">
          <ClipboardList className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No tasks</p>
          <p className="text-sm text-slate-400 mt-1">Create your first task to get started.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="w-8 px-4 py-3"></th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Title</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Linked Deal</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.map((task) => {
                const overdue = isOverdue(task);
                return (
                  <tr key={task.id} className={`hover:bg-slate-50 ${task.isDone ? "opacity-60" : ""}`}>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleTask(task.id, task.isDone)}
                        className={task.isDone ? "text-green-600" : "text-slate-400 hover:text-slate-600"}
                      >
                        {task.isDone
                          ? <CheckSquare className="h-4 w-4" />
                          : <Square className="h-4 w-4" />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <p className={`font-medium ${task.isDone ? "line-through text-slate-400" : "text-slate-800"}`}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {task.deal ? task.deal.title : "—"}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${overdue ? "text-red-600" : "text-slate-500"}`}>
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString("en-PH")
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
