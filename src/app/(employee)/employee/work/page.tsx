"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckSquare, Clock, CheckCircle2, AlertTriangle, Loader2, PlayCircle, XCircle } from "lucide-react";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate: string | null;
  startedAt: string | null;
  completedAt: string | null;
  timeSpentMinutes: number | null;
};

type TodayLog = {
  clockIn: string | null;
  clockOut: string | null;
  status: string;
  hoursWorked: number | null;
} | null;

type WorkData = {
  employee: { id: string; name: string };
  tasks: Task[];
  todayLog: TodayLog;
};

const PRIORITY_DOT: Record<string, string> = {
  HIGH: "bg-red-500", MEDIUM: "bg-amber-400", LOW: "bg-slate-300",
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatDuration(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function elapsedSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}

export default function EmployeeWorkPage() {
  const [data, setData]           = useState<WorkData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [tick, setTick]           = useState(0);

  // Tick every minute for live elapsed display
  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/employee/work").then((r) => r.json());
      if (res.success) setData(res.data);
      else setError(res.error ?? "Failed");
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const updateStatus = async (taskId: string, status: Task["status"]) => {
    setUpdatingId(taskId);
    try {
      await fetch(`/api/employee/work/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      void load();
    } finally { setUpdatingId(null); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-red-600">{error ?? "No data"}</p>
      </div>
    );
  }

  const { employee, tasks, todayLog } = data;
  const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS");
  const todo       = tasks.filter((t) => t.status === "TODO");
  const blocked    = tasks.filter((t) => t.status === "BLOCKED");
  const done       = tasks.filter((t) => t.status === "DONE");

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-indigo-600" />
          My Work
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Hello, {employee.name}</p>
      </div>

      {/* Today's attendance card */}
      <div className={`rounded-2xl border p-4 ${todayLog?.clockIn ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-200"}`}>
        <h2 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" /> Today&apos;s Attendance
        </h2>
        {todayLog?.clockIn ? (
          <div className="flex items-center gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-500">Clocked In</p>
              <p className="font-semibold text-slate-900">{formatTime(todayLog.clockIn)}</p>
            </div>
            {todayLog.clockOut ? (
              <>
                <div>
                  <p className="text-xs text-slate-500">Clocked Out</p>
                  <p className="font-semibold text-slate-900">{formatTime(todayLog.clockOut)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Hours</p>
                  <p className="font-semibold text-slate-900">{Number(todayLog.hoursWorked ?? 0).toFixed(1)}h</p>
                </div>
              </>
            ) : (
              <div>
                <p className="text-xs text-slate-500">Elapsed</p>
                <p className="font-semibold text-emerald-700">{formatDuration(elapsedSince(todayLog.clockIn))}</p>
              </div>
            )}
            <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${todayLog.status === "LATE" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
              {todayLog.status === "LATE" ? "Late" : "Present"}
            </span>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Not clocked in yet today.</p>
        )}
      </div>

      {/* In Progress — top section */}
      {inProgress.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <PlayCircle className="h-3.5 w-3.5 text-indigo-600" /> Working On ({inProgress.length})
          </h2>
          <div className="space-y-2">
            {inProgress.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onUpdate={updateStatus}
                loading={updatingId === task.id}
                primary
              />
            ))}
          </div>
        </div>
      )}

      {/* Blocked */}
      {blocked.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <XCircle className="h-3.5 w-3.5 text-red-600" /> Blocked ({blocked.length})
          </h2>
          <div className="space-y-2">
            {blocked.map((task) => (
              <TaskCard key={task.id} task={task} onUpdate={updateStatus} loading={updatingId === task.id} />
            ))}
          </div>
        </div>
      )}

      {/* To Do */}
      {todo.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <CheckSquare className="h-3.5 w-3.5 text-slate-500" /> Up Next ({todo.length})
          </h2>
          <div className="space-y-2">
            {todo.map((task) => (
              <TaskCard key={task.id} task={task} onUpdate={updateStatus} loading={updatingId === task.id} />
            ))}
          </div>
        </div>
      )}

      {/* Done today */}
      {done.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Completed ({done.length})
          </h2>
          <div className="space-y-2 opacity-70">
            {done.map((task) => (
              <TaskCard key={task.id} task={task} onUpdate={updateStatus} loading={updatingId === task.id} />
            ))}
          </div>
        </div>
      )}

      {tasks.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <CheckSquare className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No tasks assigned to you yet.</p>
          <p className="text-xs text-slate-400 mt-1">Ask your manager to assign tasks to you.</p>
        </div>
      )}
    </div>
  );
}

function TaskCard({
  task, onUpdate, loading, primary,
}: {
  task: Task;
  onUpdate: (id: string, status: Task["status"]) => void;
  loading: boolean;
  primary?: boolean;
}) {
  const elapsed = task.startedAt && task.status === "IN_PROGRESS"
    ? elapsedSince(task.startedAt)
    : null;

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";

  return (
    <div className={`rounded-2xl border bg-white p-4 ${primary ? "border-indigo-200 shadow-sm" : "border-slate-200"}`}>
      <div className="flex items-start gap-3">
        <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${PRIORITY_DOT[task.priority]}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${task.status === "DONE" ? "line-through text-slate-400" : "text-slate-900"}`}>
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{task.description}</p>
          )}
          <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-slate-500">
            {task.dueDate && (
              <span className={`flex items-center gap-1 ${isOverdue ? "text-red-600 font-semibold" : ""}`}>
                <Clock className="h-3 w-3" />
                Due {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                {isOverdue && " (overdue)"}
              </span>
            )}
            {elapsed !== null && (
              <span className="flex items-center gap-1 text-indigo-600 font-semibold">
                ⏱ {formatDuration(elapsed)}
              </span>
            )}
            {task.timeSpentMinutes !== null && task.status === "DONE" && (
              <span className="flex items-center gap-1 text-emerald-700">
                ✓ {formatDuration(task.timeSpentMinutes)} total
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      {task.status !== "DONE" && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
          {task.status === "TODO" && (
            <button
              onClick={() => onUpdate(task.id, "IN_PROGRESS")}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlayCircle className="h-3.5 w-3.5" />}
              Start Working
            </button>
          )}
          {task.status === "IN_PROGRESS" && (
            <>
              <button
                onClick={() => onUpdate(task.id, "DONE")}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                Mark Done
              </button>
              <button
                onClick={() => onUpdate(task.id, "BLOCKED")}
                disabled={loading}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50 rounded-xl disabled:opacity-50"
              >
                <AlertTriangle className="h-3.5 w-3.5" /> Blocked
              </button>
            </>
          )}
          {task.status === "BLOCKED" && (
            <button
              onClick={() => onUpdate(task.id, "IN_PROGRESS")}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-xl disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlayCircle className="h-3.5 w-3.5" />}
              Resume
            </button>
          )}
        </div>
      )}
    </div>
  );
}
