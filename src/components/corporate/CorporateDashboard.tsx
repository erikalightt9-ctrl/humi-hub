"use client";

import Link from "next/link";
import {
  Users,
  BookOpen,
  Award,
  TrendingUp,
  ClipboardList,
  ArrowRight,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface RecentEnrollment {
  readonly id: string;
  readonly status: string;
  readonly courseTier: string;
  readonly createdAt: Date | string;
  readonly student: { readonly id: string; readonly name: string; readonly email: string } | null;
  readonly course: { readonly id: string; readonly title: string; readonly slug: string };
}

interface DashboardStats {
  readonly organizationName: string;
  readonly maxSeats: number;
  readonly industry: string | null;
  readonly logoUrl: string | null;
  readonly totalEmployees: number;
  readonly activeEnrollments: number;
  readonly totalEnrollments: number;
  readonly certificatesEarned: number;
  readonly recentEnrollments: ReadonlyArray<RecentEnrollment>;
}

/* ------------------------------------------------------------------ */
/*  Clickable stat card                                                */
/* ------------------------------------------------------------------ */

function StatCard({
  href,
  label,
  value,
  sub,
  icon: Icon,
  iconClass,
  bgClass,
}: {
  readonly href: string;
  readonly label: string;
  readonly value: number | string;
  readonly sub?: string;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly iconClass: string;
  readonly bgClass: string;
}) {
  return (
    <Link
      href={href}
      className="group bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-start gap-4 hover:border-blue-300 hover:shadow-md transition-all"
    >
      <div className={`rounded-xl p-2.5 shrink-0 ${bgClass}`}>
        <Icon className={`h-5 w-5 ${iconClass}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1.5">{sub}</p>}
      </div>
      <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 transition-colors self-center shrink-0" />
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Status badge                                                       */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { readonly status: string }) {
  const styles: Record<string, string> = {
    APPROVED: "bg-green-100 text-green-700",
    ACTIVE: "bg-blue-100 text-blue-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    REJECTED: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? "bg-gray-100 text-gray-600"}`}
    >
      {status}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function CorporateDashboard({
  stats,
}: {
  readonly stats: DashboardStats;
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{stats.organizationName}</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Corporate Upskilling Dashboard
          {stats.industry ? ` · ${stats.industry}` : ""}
          {" — click any card to manage"}
        </p>
      </div>

      {/* ── Clickable Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          href="/corporate/employees"
          label="Employees"
          value={stats.totalEmployees}
          sub="Registered team members"
          icon={Users}
          iconClass="text-blue-600"
          bgClass="bg-blue-100"
        />
        <StatCard
          href="/corporate/enrollments"
          label="Active Enrollments"
          value={stats.activeEnrollments}
          sub={`${stats.totalEnrollments} total`}
          icon={BookOpen}
          iconClass="text-emerald-600"
          bgClass="bg-emerald-100"
        />
        <StatCard
          href="/corporate/employees"
          label="Certificates Earned"
          value={stats.certificatesEarned}
          sub="Completed courses"
          icon={Award}
          iconClass="text-purple-600"
          bgClass="bg-purple-100"
        />
        <StatCard
          href="/corporate/employees"
          label="Seats Used"
          value={`${stats.totalEmployees} / ${stats.maxSeats}`}
          sub="Capacity"
          icon={TrendingUp}
          iconClass="text-amber-600"
          bgClass="bg-amber-100"
        />
      </div>

      {/* ── Recent Enrollments (clickable rows) ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-gray-500" />
            Recent Enrollments
          </h2>
          <Link href="/corporate/enrollments" className="text-xs text-blue-600 hover:underline">
            View all →
          </Link>
        </div>

        {stats.recentEnrollments.length === 0 ? (
          <div className="p-10 text-center">
            <ClipboardList className="h-8 w-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No enrollments yet.</p>
            <Link
              href="/corporate/enrollments"
              className="mt-2 inline-block text-sm text-blue-600 hover:underline"
            >
              Enroll employees →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {stats.recentEnrollments.map((enrollment) => (
              <Link
                key={enrollment.id}
                href="/corporate/enrollments"
                className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors group"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                    {enrollment.student?.name ?? "Unknown"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {enrollment.course.title} · {enrollment.courseTier}
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <StatusBadge status={enrollment.status} />
                  <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Quick Actions ── */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/corporate/employees"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          <Users className="h-4 w-4" />
          Manage Employees
        </Link>
        <Link
          href="/corporate/enrollments"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors"
        >
          <BookOpen className="h-4 w-4" />
          Enroll Employees
        </Link>
        <Link
          href="/corporate/analytics"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-800 text-white rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors"
        >
          <TrendingUp className="h-4 w-4" />
          Progress Reports
        </Link>
      </div>
    </div>
  );
}
