"use client";

import Link from "next/link";
import {
  Users,
  BookOpen,
  Award,
  GraduationCap,
  CheckSquare,
  Plus,
  ArrowRight,
  Lock,
  Sparkles,
  BarChart3,
  FileText,
  TrendingUp,
  ClipboardList,
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
/*  Stat card                                                          */
/* ------------------------------------------------------------------ */

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  href,
}: {
  readonly label: string;
  readonly value: number | string;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly color: string;
  readonly href?: string;
}) {
  const inner = (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 hover:shadow-sm transition-shadow">
      <div className={`p-3 rounded-xl shrink-0 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900 leading-none">{value}</div>
        <div className="text-xs text-gray-500 mt-1">{label}</div>
      </div>
      {href && <ArrowRight className="h-4 w-4 text-gray-300 ml-auto" />}
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : <div>{inner}</div>;
}

/* ------------------------------------------------------------------ */
/*  Core module card                                                   */
/* ------------------------------------------------------------------ */

function ModuleCard({
  href,
  icon: Icon,
  label,
  description,
  color,
  badge,
}: {
  readonly href: string;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly label: string;
  readonly description: string;
  readonly color: string;
  readonly badge?: number;
}) {
  return (
    <Link
      href={href}
      className="group bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3 hover:shadow-md hover:border-blue-200 transition-all"
    >
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        {badge !== undefined && badge > 0 && (
          <span className="text-xs font-semibold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>
      <div>
        <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm">
          {label}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
      </div>
      <div className="flex items-center gap-1 text-xs text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity mt-auto">
        Open <ArrowRight className="h-3 w-3" />
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Coming Soon card                                                   */
/* ------------------------------------------------------------------ */

function ComingSoonCard({
  icon: Icon,
  label,
  description,
  color,
}: {
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly label: string;
  readonly description: string;
  readonly color: string;
}) {
  return (
    <div
      title="Coming soon — currently in development"
      className="bg-gray-50 rounded-xl border border-dashed border-gray-200 p-5 flex flex-col gap-3 opacity-60 cursor-not-allowed"
    >
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-xl ${color} opacity-60`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-slate-100 text-slate-400 border border-slate-200 px-2 py-0.5 rounded-full">
          <Lock className="h-2.5 w-2.5" />
          Soon
        </span>
      </div>
      <div>
        <p className="font-semibold text-gray-400 text-sm">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{description}</p>
      </div>
      <div className="flex items-center gap-1 text-xs text-slate-400 font-medium mt-auto">
        <Lock className="h-3 w-3" />
        Coming Soon
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Enrollment status badge                                            */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { readonly status: string }) {
  const styles: Record<string, string> = {
    APPROVED:         "bg-green-100 text-green-700",
    ACTIVE:           "bg-blue-100 text-blue-700",
    ENROLLED:         "bg-blue-100 text-blue-700",
    PENDING:          "bg-yellow-100 text-yellow-700",
    PAYMENT_VERIFIED: "bg-teal-100 text-teal-700",
    REJECTED:         "bg-red-100 text-red-700",
  };

  const label: Record<string, string> = {
    APPROVED:         "Approved",
    ACTIVE:           "Active",
    ENROLLED:         "Enrolled",
    PENDING:          "Pending",
    PAYMENT_VERIFIED: "Verified",
    REJECTED:         "Rejected",
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? "bg-gray-100 text-gray-600"}`}>
      {label[status] ?? status}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard                                                          */
/* ------------------------------------------------------------------ */

export function CorporateDashboard({ stats }: { readonly stats: DashboardStats }) {
  const seatPct = Math.min(100, Math.round((stats.totalEmployees / stats.maxSeats) * 100));

  return (
    <div className="space-y-8 max-w-6xl">

      {/* ── Welcome + quick actions ──────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {stats.organizationName}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {stats.industry ? `${stats.industry} · ` : ""}Corporate Training Dashboard
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/corporate/courses"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            Browse Courses
          </Link>
          <Link
            href="/corporate/employees"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Student
          </Link>
        </div>
      </div>

      {/* ── Stats ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Students"
          value={stats.totalEmployees}
          icon={Users}
          color="bg-blue-100 text-blue-600"
          href="/corporate/employees"
        />
        <StatCard
          label="Active Enrollments"
          value={stats.activeEnrollments}
          icon={ClipboardList}
          color="bg-green-100 text-green-600"
        />
        <StatCard
          label="Certificates Earned"
          value={stats.certificatesEarned}
          icon={Award}
          color="bg-purple-100 text-purple-600"
        />
      </div>

      {/* ── Seats progress ───────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center gap-6">
        <TrendingUp className="h-5 w-5 text-amber-500 shrink-0" />
        <div className="flex-1">
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="font-medium text-gray-700">Seat Usage</span>
            <span className="text-gray-400 text-xs">
              {stats.totalEmployees} / {stats.maxSeats} seats · {seatPct}%
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${seatPct >= 90 ? "bg-red-500" : "bg-amber-500"}`}
              style={{ width: `${seatPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Core modules ─────────────────────────────────────────────── */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Modules
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <ModuleCard
            href="/corporate/courses"
            icon={BookOpen}
            label="Courses"
            description="Browse and assign courses to your team"
            color="bg-emerald-100 text-emerald-600"
          />
          <ModuleCard
            href="/corporate/employees"
            icon={Users}
            label="Students"
            description="Manage your enrolled team members"
            color="bg-blue-100 text-blue-600"
            badge={stats.totalEmployees}
          />
          <ModuleCard
            href="/corporate/trainers"
            icon={GraduationCap}
            label="Trainers"
            description="View your assigned certified trainers"
            color="bg-indigo-100 text-indigo-600"
          />
          <ModuleCard
            href="/corporate/tasks"
            icon={CheckSquare}
            label="Tasks"
            description="Assign and track team tasks"
            color="bg-orange-100 text-orange-600"
          />
        </div>
      </div>

      {/* ── Coming Soon ──────────────────────────────────────────────── */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Coming Soon
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <ComingSoonCard
            icon={Sparkles}
            label="AI Summary"
            description="Auto-summarize course content with AI"
            color="bg-pink-100 text-pink-600"
          />
          <ComingSoonCard
            icon={BarChart3}
            label="Analytics"
            description="Completion rates, trends, and exports"
            color="bg-purple-100 text-purple-600"
          />
          <ComingSoonCard
            icon={FileText}
            label="Grammar Checker"
            description="AI-powered writing assistance for your team"
            color="bg-teal-100 text-teal-600"
          />
        </div>
      </div>

      {/* ── Recent activity ──────────────────────────────────────────── */}
      {stats.recentEnrollments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">Recent Enrollments</h2>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {stats.recentEnrollments.slice(0, 5).map((enrollment) => (
              <div key={enrollment.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {enrollment.student?.name ?? "Unknown"}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {enrollment.course.title}
                    {enrollment.courseTier ? ` · ${enrollment.courseTier}` : ""}
                  </div>
                </div>
                <StatusBadge status={enrollment.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
