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
  accent,
  href,
}: {
  readonly label: string;
  readonly value: number | string;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly accent: string;
  readonly href?: string;
}) {
  const inner = (
    <div className="bg-ds-card rounded-xl border border-ds-border p-5 flex items-center gap-4 hover:border-ds-primary/40 transition-colors group">
      <div className={`p-3 rounded-xl shrink-0 ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-2xl font-bold text-ds-text leading-none">{value}</div>
        <div className="text-xs text-ds-muted mt-1">{label}</div>
      </div>
      {href && <ArrowRight className="h-4 w-4 text-ds-muted ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />}
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : <div>{inner}</div>;
}

/* ------------------------------------------------------------------ */
/*  Module card                                                        */
/* ------------------------------------------------------------------ */

function ModuleCard({
  href,
  icon: Icon,
  label,
  description,
  accent,
  badge,
}: {
  readonly href: string;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly label: string;
  readonly description: string;
  readonly accent: string;
  readonly badge?: number;
}) {
  return (
    <Link
      href={href}
      className="group bg-ds-card rounded-xl border border-ds-border p-5 flex flex-col gap-3 hover:border-ds-primary/50 hover:shadow-lg hover:shadow-black/20 transition-all"
    >
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-xl ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
        {badge !== undefined && badge > 0 && (
          <span className="text-xs font-semibold bg-ds-primary/20 text-blue-300 px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>
      <div>
        <p className="font-semibold text-ds-text group-hover:text-blue-300 transition-colors text-sm">
          {label}
        </p>
        <p className="text-xs text-ds-muted mt-0.5 leading-relaxed">{description}</p>
      </div>
      <div className="flex items-center gap-1 text-xs text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity mt-auto">
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
  accent,
}: {
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly label: string;
  readonly description: string;
  readonly accent: string;
}) {
  return (
    <div
      title="Coming soon — currently in development"
      className="bg-ds-card/40 rounded-xl border border-dashed border-ds-border p-5 flex flex-col gap-3 opacity-50 cursor-not-allowed"
    >
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-xl ${accent} opacity-50`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-ds-surface text-ds-muted border border-ds-border px-2 py-0.5 rounded-full">
          <Lock className="h-2.5 w-2.5" />
          Soon
        </span>
      </div>
      <div>
        <p className="font-semibold text-ds-muted text-sm">{label}</p>
        <p className="text-xs text-ds-muted/70 mt-0.5 leading-relaxed">{description}</p>
      </div>
      <div className="flex items-center gap-1 text-xs text-ds-muted font-medium mt-auto">
        <Lock className="h-3 w-3" />
        Coming Soon
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Status badge                                                       */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { readonly status: string }) {
  const styles: Record<string, string> = {
    APPROVED:         "bg-emerald-900/40 text-emerald-400 border-emerald-800",
    ACTIVE:           "bg-blue-900/40 text-blue-400 border-blue-800",
    ENROLLED:         "bg-blue-900/40 text-blue-400 border-blue-800",
    PENDING:          "bg-amber-900/40 text-amber-400 border-amber-800",
    PAYMENT_VERIFIED: "bg-teal-900/40 text-teal-400 border-teal-800",
    REJECTED:         "bg-red-900/40 text-red-400 border-red-800",
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
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status] ?? "bg-ds-surface text-ds-muted border-ds-border"}`}>
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
          <h1 className="text-2xl font-bold text-ds-text">
            {stats.organizationName}
          </h1>
          <p className="text-sm text-ds-muted mt-0.5">
            {stats.industry ? `${stats.industry} · ` : ""}Corporate Training Dashboard
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/corporate/courses"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-ds-text bg-ds-card border border-ds-border rounded-xl hover:border-ds-primary/50 transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            Browse Courses
          </Link>
          <Link
            href="/corporate/employees"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-ds-primary text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Student
          </Link>
        </div>
      </div>

      {/* ── Stats ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Students"      value={stats.totalEmployees}    icon={Users}         accent="bg-blue-900/50 text-blue-400"    href="/corporate/employees" />
        <StatCard label="Active Enrollments"  value={stats.activeEnrollments}  icon={ClipboardList} accent="bg-emerald-900/50 text-emerald-400" />
        <StatCard label="Certificates Earned" value={stats.certificatesEarned} icon={Award}         accent="bg-purple-900/50 text-purple-400" />
      </div>

      {/* ── Seat usage ───────────────────────────────────────────────── */}
      <div className="bg-ds-card rounded-xl border border-ds-border px-5 py-4 flex items-center gap-5">
        <TrendingUp className="h-5 w-5 text-amber-400 shrink-0" />
        <div className="flex-1">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium text-ds-text">Seat Usage</span>
            <span className="text-ds-muted text-xs">
              {stats.totalEmployees} / {stats.maxSeats} · {seatPct}%
            </span>
          </div>
          <div className="w-full bg-ds-surface rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${seatPct >= 90 ? "bg-red-500" : "bg-amber-500"}`}
              style={{ width: `${seatPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Core modules ─────────────────────────────────────────────── */}
      <div>
        <h2 className="text-xs font-semibold text-ds-muted uppercase tracking-wider mb-3">
          Modules
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <ModuleCard href="/corporate/courses"   icon={BookOpen}      label="Courses"  description="Browse and assign courses to your team"  accent="bg-emerald-900/50 text-emerald-400" />
          <ModuleCard href="/corporate/employees" icon={Users}         label="Students" description="Manage your enrolled team members"        accent="bg-blue-900/50 text-blue-400"    badge={stats.totalEmployees} />
          <ModuleCard href="/corporate/trainers"  icon={GraduationCap} label="Trainers" description="View your assigned certified trainers"    accent="bg-indigo-900/50 text-indigo-400" />
          <ModuleCard href="/corporate/tasks"     icon={CheckSquare}   label="Tasks"    description="Assign and track team tasks"             accent="bg-orange-900/50 text-orange-400" />
        </div>
      </div>

      {/* ── Coming Soon ──────────────────────────────────────────────── */}
      <div>
        <h2 className="text-xs font-semibold text-ds-muted uppercase tracking-wider mb-3">
          Coming Soon
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <ComingSoonCard icon={Sparkles} label="AI Summary"       description="Auto-summarize course content with AI"        accent="bg-pink-900/50 text-pink-400" />
          <ComingSoonCard icon={BarChart3} label="Analytics"       description="Completion rates, trends, and exports"       accent="bg-purple-900/50 text-purple-400" />
          <ComingSoonCard icon={FileText}  label="Grammar Checker" description="AI-powered writing assistance for your team" accent="bg-teal-900/50 text-teal-400" />
        </div>
      </div>

      {/* ── Recent activity ──────────────────────────────────────────── */}
      {stats.recentEnrollments.length > 0 && (
        <div className="bg-ds-card rounded-xl border border-ds-border">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-ds-border">
            <ClipboardList className="h-4 w-4 text-ds-muted" />
            <h2 className="text-sm font-semibold text-ds-text">Recent Enrollments</h2>
          </div>
          <div className="divide-y divide-ds-border">
            {stats.recentEnrollments.slice(0, 5).map((enrollment) => (
              <div key={enrollment.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className="text-sm font-medium text-ds-text">
                    {enrollment.student?.name ?? "Unknown"}
                  </div>
                  <div className="text-xs text-ds-muted mt-0.5">
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
