"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import {
  CalendarDays, Users, ChevronRight, Loader2, Plus, Search,
  Clock, CheckCircle2, Circle, XCircle,
} from "lucide-react";

type Schedule = {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  maxCapacity: number;
  course: { id: string; slug: string; title: string };
  trainer: { id: string; name: string } | null;
  _count: { students: number; waitlist: number };
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  OPEN:      { label: "Open",      cls: "bg-emerald-100 text-emerald-700", icon: Circle },
  FULL:      { label: "Full",      cls: "bg-amber-100 text-amber-700",    icon: CheckCircle2 },
  CLOSED:    { label: "Closed",    cls: "bg-slate-100 text-slate-500",    icon: XCircle },
  COMPLETED: { label: "Completed", cls: "bg-indigo-100 text-indigo-700",  icon: CheckCircle2 },
};

export default function SchedulesListPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "100" });
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/admin/schedules?${params}`).then((r) => r.json());
    if (res.success) setSchedules(res.data.schedules?.data ?? res.data.schedules ?? []);
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => { void load(); }, [load]);

  const today = new Date();

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Schedules</h1>
          <p className="text-sm text-slate-500 mt-0.5">All training batches — click a batch to manage attendance</p>
        </div>
        <Link
          href="/admin/schedules"
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl font-medium transition-colors"
        >
          <Plus className="h-4 w-4" /> New Batch
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search batches…"
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
        </div>
        <div className="flex gap-1.5">
          {["", "OPEN", "FULL", "CLOSED", "COMPLETED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 text-xs rounded-xl font-medium transition-colors ${
                statusFilter === s
                  ? "bg-indigo-600 text-white"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {s || "All"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : schedules.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <CalendarDays className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No batches found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {schedules.map((s) => {
            const st = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.CLOSED;
            const Icon = st.icon;
            const start = new Date(s.startDate);
            const end = new Date(s.endDate);
            const isRunning = start <= today && end >= today;
            const pctFull = Math.round((s._count.students / s.maxCapacity) * 100);

            return (
              <Link
                key={s.id}
                href={`/admin/training-center/schedules/${s.id}`}
                className="group block rounded-2xl border border-slate-200 bg-white p-4 hover:shadow-md hover:border-indigo-200 transition-all"
              >
                <div className="flex items-start gap-4">
                  {/* Status dot */}
                  <div className={`mt-0.5 h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${st.cls}`}>
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                          {s.name}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{s.course.title}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isRunning && (
                          <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                            In Progress
                          </span>
                        )}
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.cls}`}>
                          {st.label}
                        </span>
                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {start.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        {" – "}
                        {end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {s.startTime} – {s.endTime}
                      </span>
                      <span>{s.daysOfWeek.map((d) => DAY_LABELS[d]).join(", ")}</span>
                      {s.trainer && <span>Trainer: {s.trainer.name}</span>}
                    </div>

                    {/* Capacity bar */}
                    <div className="flex items-center gap-2 mt-3">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            pctFull >= 100 ? "bg-red-400" : pctFull >= 80 ? "bg-amber-400" : "bg-emerald-400"
                          }`}
                          style={{ width: `${Math.min(100, pctFull)}%` }}
                        />
                      </div>
                      <span className="flex items-center gap-1 text-xs text-slate-500 shrink-0">
                        <Users className="h-3 w-3" />
                        {s._count.students}/{s.maxCapacity}
                        {s._count.waitlist > 0 && (
                          <span className="text-amber-600 ml-1">+{s._count.waitlist} waiting</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
