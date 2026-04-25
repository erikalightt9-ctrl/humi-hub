"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Users, Clock, RefreshCw, Loader2, AlertTriangle, CheckCircle2, UserX } from "lucide-react";

type EmployeeLive = {
  id: string;
  name: string;
  position: string;
  department: string;
  avatarUrl: string | null;
  clockIn: string | null;
  clockOut: string | null;
  hoursWorked: number | null;
  status: string;
  photoUrl: string | null;
  isCurrentlyIn: boolean;
  elapsedMinutes: number | null;
  notes: string | null;
};

type Summary = {
  currentlyIn: number;
  late: number;
  completed: number;
  absent: number;
  total: number;
};

const REFRESH_INTERVAL = 60_000; // 1 minute

function formatElapsed(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default function LiveAttendancePage() {
  const [employees, setEmployees] = useState<EmployeeLive[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [asOf, setAsOf] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/hr/attendance/live");
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed");
      setEmployees(json.data.employees);
      setSummary(json.data.summary);
      setAsOf(json.data.asOf);
      setLastRefresh(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Initial load + auto-refresh
  useEffect(() => {
    void load();
    timerRef.current = setInterval(() => void load(true), REFRESH_INTERVAL);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [load]);

  // Live elapsed time counter (client-side, increments every minute)
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  const in_group     = employees.filter((e) => e.isCurrentlyIn && e.status !== "LATE");
  const late_group   = employees.filter((e) => e.isCurrentlyIn && e.status === "LATE");
  const done_group   = employees.filter((e) => !!e.clockOut);
  const absent_group = employees.filter((e) => !e.clockIn);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            Live Attendance
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time view — auto-refreshes every minute
            {asOf && <span className="ml-2 text-xs">· Last updated {formatTime(asOf)}</span>}
          </p>
        </div>
        <button
          onClick={() => void load()}
          className="flex items-center gap-1.5 px-3 py-2 text-xs border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* KPIs */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <KpiCard label="In Office" value={summary.currentlyIn} color="emerald" icon={<Users className="h-4 w-4 text-emerald-600" />} />
          <KpiCard label="Late"      value={summary.late}        color="amber"   icon={<AlertTriangle className="h-4 w-4 text-amber-600" />} />
          <KpiCard label="Completed" value={summary.completed}   color="indigo"  icon={<CheckCircle2 className="h-4 w-4 text-indigo-600" />} />
          <KpiCard label="Absent"    value={summary.absent}      color="red"     icon={<UserX className="h-4 w-4 text-red-600" />} />
          <KpiCard label="Total"     value={summary.total}       color="slate"   icon={<Users className="h-4 w-4 text-slate-500" />} />
        </div>
      )}

      {/* Sections */}
      <div className="space-y-5">
        <AttendanceSection
          title="Currently In"
          count={in_group.length}
          color="emerald"
          employees={in_group}
          showElapsed
        />
        <AttendanceSection
          title="Late"
          count={late_group.length}
          color="amber"
          employees={late_group}
          showElapsed
        />
        <AttendanceSection
          title="Completed Shift"
          count={done_group.length}
          color="indigo"
          employees={done_group}
          showHours
        />
        <AttendanceSection
          title="Not Yet In"
          count={absent_group.length}
          color="slate"
          employees={absent_group}
        />
      </div>
    </div>
  );
}

function KpiCard({
  label, value, color, icon,
}: {
  label: string; value: number; color: string; icon: React.ReactNode;
}) {
  const bg: Record<string, string> = {
    emerald: "bg-emerald-50 border-emerald-200",
    amber:   "bg-amber-50 border-amber-200",
    indigo:  "bg-indigo-50 border-indigo-200",
    red:     "bg-red-50 border-red-200",
    slate:   "bg-white border-slate-200",
  };
  return (
    <div className={`rounded-2xl border p-4 ${bg[color] ?? bg.slate}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-900 tabular-nums mt-1">{value}</p>
    </div>
  );
}

function AttendanceSection({
  title, count, color, employees, showElapsed, showHours,
}: {
  title: string;
  count: number;
  color: string;
  employees: EmployeeLive[];
  showElapsed?: boolean;
  showHours?: boolean;
}) {
  const dot: Record<string, string> = {
    emerald: "bg-emerald-500",
    amber:   "bg-amber-500",
    indigo:  "bg-indigo-500",
    slate:   "bg-slate-400",
  };

  if (count === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className={`h-2 w-2 rounded-full ${dot[color] ?? dot.slate}`} />
        <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
        <span className="text-xs text-slate-400">({count})</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {employees.map((emp) => (
          <EmployeeCard
            key={emp.id}
            employee={emp}
            showElapsed={showElapsed}
            showHours={showHours}
          />
        ))}
      </div>
    </div>
  );
}

function EmployeeCard({
  employee: emp, showElapsed, showHours,
}: {
  employee: EmployeeLive;
  showElapsed?: boolean;
  showHours?: boolean;
}) {
  // Live elapsed update
  const elapsedNow = emp.isCurrentlyIn && emp.clockIn
    ? Math.floor((Date.now() - new Date(emp.clockIn).getTime()) / 60000)
    : emp.elapsedMinutes;

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3">
      {/* Avatar / Photo */}
      <div className="shrink-0">
        {emp.photoUrl ? (
          <img
            src={emp.photoUrl}
            alt={emp.name}
            className="h-10 w-10 rounded-full object-cover border border-slate-200"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500">
            {emp.name.charAt(0)}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate">{emp.name}</p>
        <p className="text-[11px] text-slate-400 truncate">{emp.position}</p>
        {emp.department && emp.department !== "—" && (
          <p className="text-[11px] text-slate-400 truncate">{emp.department}</p>
        )}

        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
          {emp.clockIn && (
            <span className="flex items-center gap-0.5 text-slate-500">
              <Clock className="h-3 w-3" /> In {formatTime(emp.clockIn)}
            </span>
          )}
          {emp.clockOut && (
            <span className="flex items-center gap-0.5 text-slate-500">
              Out {formatTime(emp.clockOut)}
            </span>
          )}
          {showElapsed && elapsedNow !== null && (
            <span className="font-semibold text-emerald-700">
              {formatElapsed(elapsedNow)}
            </span>
          )}
          {showHours && emp.hoursWorked !== null && (
            <span className="font-semibold text-indigo-700">
              {emp.hoursWorked.toFixed(1)}h worked
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
