"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  GraduationCap, CalendarDays, Users, Award, TrendingUp,
  AlertTriangle, Loader2, ChevronRight,
} from "lucide-react";

type Overview = {
  activeBatches: number;
  totalParticipants: number;
  todaySessions: number;
  attendanceRate: number;
  certsIssued: number;
  certsIssuedThisMonth: number;
  lowAttendanceCount: number;
};

export default function TrainingCenterOverviewPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/training-center/overview")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setData(json.data);
        else setError(json.error ?? "Failed to load");
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !data) {
    return <div className="text-sm text-red-600 p-4">{error ?? "No data"}</div>;
  }

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Active Batches"
          value={data.activeBatches}
          icon={<CalendarDays className="h-5 w-5 text-indigo-600" />}
          href="/admin/training-center/schedules"
        />
        <KpiCard
          label="Participants"
          value={data.totalParticipants}
          icon={<Users className="h-5 w-5 text-emerald-600" />}
          href="/admin/training-center/participants"
        />
        <KpiCard
          label="Attendance Rate"
          value={`${data.attendanceRate}%`}
          icon={<TrendingUp className={`h-5 w-5 ${data.attendanceRate >= 75 ? "text-emerald-600" : "text-amber-600"}`} />}
          warn={data.attendanceRate < 75}
        />
        <KpiCard
          label="Certs Issued"
          value={data.certsIssued}
          icon={<Award className="h-5 w-5 text-yellow-600" />}
          href="/admin/training-center/certifications"
          sub={`+${data.certsIssuedThisMonth} this month`}
        />
      </div>

      {/* Today's sessions + alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="h-4 w-4 text-indigo-500" />
            <h2 className="text-sm font-semibold text-slate-700">Today</h2>
          </div>
          <div className="text-4xl font-bold text-slate-900 tabular-nums">
            {data.todaySessions}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {data.todaySessions === 1 ? "session" : "sessions"} scheduled for today
          </p>
          <Link
            href="/admin/training-center/schedules"
            className="mt-4 inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
          >
            View all schedules <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-slate-700">Attendance Alerts</h2>
          </div>
          {data.lowAttendanceCount === 0 ? (
            <div className="py-4 text-center">
              <p className="text-sm text-emerald-600 font-medium">All participants are on track</p>
              <p className="text-xs text-slate-400 mt-1">No one below the 75% threshold</p>
            </div>
          ) : (
            <>
              <div className="text-4xl font-bold text-amber-600 tabular-nums">
                {data.lowAttendanceCount}
              </div>
              <p className="text-sm text-slate-500 mt-1">
                {data.lowAttendanceCount === 1 ? "participant" : "participants"} below 75% attendance
              </p>
              <Link
                href="/admin/training-center/certifications?status=not_eligible"
                className="mt-4 inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium"
              >
                View at-risk participants <ChevronRight className="h-3 w-3" />
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "View Schedules",    href: "/admin/training-center/schedules",     icon: CalendarDays, color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
            { label: "All Participants",  href: "/admin/training-center/participants",   icon: Users,        color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
            { label: "Issue Certs",       href: "/admin/training-center/certifications?status=eligible", icon: Award, color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
            { label: "Course Programs",   href: "/admin/training-center/programs",       icon: GraduationCap, color: "text-violet-600 bg-violet-50 border-violet-200" },
          ].map((q) => (
            <Link
              key={q.href}
              href={q.href}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 hover:shadow-md hover:scale-[1.02] transition-all ${q.color}`}
            >
              <q.icon className="h-5 w-5 shrink-0" />
              <span className="text-sm font-semibold">{q.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label, value, icon, href, sub, warn,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  href?: string;
  sub?: string;
  warn?: boolean;
}) {
  const inner = (
    <div className={`rounded-2xl border p-4 bg-white h-full ${warn ? "border-amber-200" : "border-slate-200"}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-900 tabular-nums mt-2">{value}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
  if (href) return <Link href={href} className="block hover:scale-[1.02] transition-transform">{inner}</Link>;
  return inner;
}
