"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CheckSquare, Square, Plus, Loader2, CalendarDays,
  AlertCircle, CheckCircle2, Clock, X,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type TaskStatus   = "TODO" | "IN_PROGRESS" | "DONE";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

interface Task {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly status: TaskStatus;
  readonly priority: TaskPriority;
  readonly dueDate: string | null;
  readonly assigneeName: string | null;
  readonly createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUS_COLS: ReadonlyArray<{ status: TaskStatus; label: string; border: string; icon: React.ReactNode }> = [
  { status: "TODO",        label: "To Do",      border: "border-ds-border",  icon: <Square       className="h-4 w-4 text-ds-muted" /> },
  { status: "IN_PROGRESS", label: "In Progress", border: "border-blue-800",   icon: <Clock        className="h-4 w-4 text-blue-400" /> },
  { status: "DONE",        label: "Done",        border: "border-emerald-800", icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" /> },
];

const PRIORITY_STYLE: Record<TaskPriority, string> = {
  LOW:    "bg-ds-surface text-ds-muted border border-ds-border",
  MEDIUM: "bg-amber-900/40 text-amber-400 border border-amber-800",
  HIGH:   "bg-red-900/40 text-red-400 border border-red-800",
};

function isOverdue(d: string | null) { return !!d && new Date(d) < new Date(); }
function fmt(d: string) { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }); }

/* ------------------------------------------------------------------ */
/*  Task Card                                                          */
/* ------------------------------------------------------------------ */

function TaskCard({ task, onStatusChange }: {
  readonly task: Task;
  readonly onStatusChange: (id: string, status: TaskStatus) => void;
}) {
  const overdue = task.status !== "DONE" && isOverdue(task.dueDate);

  return (
    <div className="bg-ds-bg rounded-xl border border-ds-border p-3.5 space-y-2.5 hover:border-ds-primary/40 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <p className={`text-sm font-medium leading-snug ${task.status === "DONE" ? "line-through text-ds-muted" : "text-ds-text"}`}>
          {task.title}
        </p>
        <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded-lg font-medium ${PRIORITY_STYLE[task.priority]}`}>
          {task.priority}
        </span>
      </div>

      {task.description && (
        <p className="text-xs text-ds-muted line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between gap-2 pt-1 border-t border-ds-border">
        <div className="flex items-center gap-2">
          {task.dueDate && (
            <span className={`flex items-center gap-1 text-xs ${overdue ? "text-red-400 font-medium" : "text-ds-muted"}`}>
              {overdue ? <AlertCircle className="h-3 w-3" /> : <CalendarDays className="h-3 w-3" />}
              {fmt(task.dueDate)}
            </span>
          )}
          {task.assigneeName && (
            <span className="text-xs text-ds-muted truncate max-w-[80px]">{task.assigneeName}</span>
          )}
        </div>

        <select
          value={task.status}
          onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
          className="text-xs bg-ds-surface border border-ds-border text-ds-muted rounded-lg px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-ds-primary cursor-pointer"
        >
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DONE">Done</option>
        </select>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Add Task Modal                                                     */
/* ------------------------------------------------------------------ */

function AddTaskModal({ onClose, onAdd }: {
  readonly onClose: () => void;
  readonly onAdd: (task: Omit<Task, "id" | "createdAt">) => Promise<void>;
}) {
  const [title, setTitle]             = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority]       = useState<TaskPriority>("MEDIUM");
  const [dueDate, setDueDate]         = useState("");
  const [saving, setSaving]           = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    await onAdd({ title: title.trim(), description: description.trim() || null, status: "TODO", priority, dueDate: dueDate || null, assigneeName: null });
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-ds-card rounded-xl border border-ds-border shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-ds-border">
          <h2 className="text-base font-semibold text-ds-text">New Task</h2>
          <button onClick={onClose} className="text-ds-muted hover:text-ds-text transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-ds-muted mb-1">Title *</label>
            <input
              type="text" required value={title} onChange={(e) => setTitle(e.target.value)} autoFocus
              placeholder="What needs to be done?"
              className="w-full px-3 py-2 text-sm bg-ds-surface border border-ds-border text-ds-text placeholder:text-ds-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ds-muted mb-1">Description</label>
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              placeholder="Optional details…"
              className="w-full px-3 py-2 text-sm bg-ds-surface border border-ds-border text-ds-text placeholder:text-ds-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-ds-primary/50 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ds-muted mb-1">Priority</label>
              <select
                value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 text-sm bg-ds-surface border border-ds-border text-ds-text rounded-xl focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ds-muted mb-1">Due Date</label>
              <input
                type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-ds-surface border border-ds-border text-ds-text rounded-xl focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-ds-muted hover:text-ds-text transition-colors">
              Cancel
            </button>
            <button
              type="submit" disabled={saving || !title.trim()}
              className="px-4 py-2 text-sm bg-ds-primary text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CorporateTasksPage() {
  const [tasks, setTasks]     = useState<ReadonlyArray<Task>>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const loadTasks = useCallback(async () => {
    try {
      const r = await fetch("/api/corporate/tasks");
      const json = await r.json();
      if (json.success) setTasks(json.data ?? []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadTasks(); }, [loadTasks]);

  async function handleStatusChange(id: string, status: TaskStatus) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    try {
      await fetch(`/api/corporate/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch (err) { console.error(err); void loadTasks(); }
  }

  async function handleAdd(data: Omit<Task, "id" | "createdAt">) {
    try {
      const r = await fetch("/api/corporate/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await r.json();
      if (json.success && json.data) setTasks((prev) => [json.data as Task, ...prev]);
    } catch (err) { console.error(err); }
  }

  const counts = {
    TODO:        tasks.filter((t) => t.status === "TODO").length,
    IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS").length,
    DONE:        tasks.filter((t) => t.status === "DONE").length,
  };
  const overdueCount = tasks.filter((t) => t.status !== "DONE" && isOverdue(t.dueDate)).length;

  return (
    <div className="space-y-6 max-w-6xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ds-text">Tasks</h1>
          <p className="text-sm text-ds-muted mt-0.5">Assign and track team tasks with deadlines</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-ds-primary text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Task
        </button>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-6 text-sm bg-ds-card rounded-xl border border-ds-border px-5 py-3">
        <span className="font-medium text-ds-text">{tasks.length} tasks</span>
        <span className="flex items-center gap-1.5 text-ds-muted">
          <Square className="h-3.5 w-3.5" />{counts.TODO} to do
        </span>
        <span className="flex items-center gap-1.5 text-ds-muted">
          <Clock className="h-3.5 w-3.5 text-blue-400" />{counts.IN_PROGRESS} in progress
        </span>
        <span className="flex items-center gap-1.5 text-ds-muted">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />{counts.DONE} done
        </span>
        {overdueCount > 0 && (
          <span className="flex items-center gap-1.5 text-red-400 font-medium ml-auto">
            <AlertCircle className="h-3.5 w-3.5" />{overdueCount} overdue
          </span>
        )}
      </div>

      {/* Kanban */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin text-ds-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STATUS_COLS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.status);
            return (
              <div key={col.status} className={`bg-ds-card rounded-xl border-2 ${col.border} p-4 space-y-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {col.icon}
                    <span className="text-sm font-semibold text-ds-text">{col.label}</span>
                  </div>
                  <span className="text-xs bg-ds-surface border border-ds-border text-ds-muted rounded-full px-2 py-0.5">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-2.5 min-h-[180px]">
                  {colTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-ds-muted/40">
                      <CheckSquare className="h-8 w-8 mb-2" />
                      <p className="text-xs">No tasks here</p>
                    </div>
                  ) : colTasks.map((task) => (
                    <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} />
                  ))}
                </div>

                {col.status === "TODO" && (
                  <button
                    onClick={() => setShowAdd(true)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-ds-muted hover:text-ds-text hover:bg-ds-surface rounded-xl border border-dashed border-ds-border hover:border-ds-primary/50 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />Add task
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showAdd && <AddTaskModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
    </div>
  );
}
