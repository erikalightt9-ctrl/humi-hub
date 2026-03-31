import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import {
  Users,
  UserCheck,
  CreditCard,
  BookOpen,
  MessageSquare,
  BarChart3,
  UserPlus,
  FileSearch,
  Plus,
  Award,
  Activity,
  ArrowRight,
} from "lucide-react";
import { getAnalyticsStats } from "@/lib/repositories/admin.repository";
import {
  getRevenueSnapshot,
  getEnrollmentPipeline,
  getRecentActivity,
  getContactMessageCount,
} from "@/lib/repositories/dashboard.repository";

export const metadata: Metadata = { title: "Dashboard | Humi Hub Admin" };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const ACTIVITY_ICONS: Record<string, typeof Users> = {
  enrollment: UserPlus,
  payment: CreditCard,
  certificate: Award,
};

const ACTIVITY_COLORS: Record<string, string> = {
  enrollment: "text-blue-700 bg-blue-50",
  payment: "text-emerald-600 bg-emerald-50",
  certificate: "text-blue-700 bg-blue-50",
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface ModuleCardProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  bgClass: string;
  title: string;
  value: number | string;
  sub: string;
  badge?: { label: string; value: number; color: string } | null;
}

function ModuleCard({
  href,
  icon: Icon,
  iconClass,
  bgClass,
  title,
  value,
  sub,
  badge,
}: ModuleCardProps) {
  return (
    <Link
      href={href}
      className="group bg-ds-card rounded-2xl border border-ds-border shadow-sm p-5 flex items-start gap-4 hover:border-ds-primary/50 hover:shadow-md transition-all"
    >
      <div className={`rounded-xl p-2.5 shrink-0 ${bgClass}`}>
        <Icon className={`h-5 w-5 ${iconClass}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-ds-muted mb-1">{title}</p>
        <p className="text-2xl font-bold text-ds-text leading-none">{value}</p>
        <p className="text-xs text-ds-muted mt-1.5">{sub}</p>
        {badge && badge.value > 0 && (
          <span
            className={`inline-flex items-center mt-2 px-2 py-0.5 rounded-full text-xs font-semibold ${badge.color}`}
          >
            {badge.value} {badge.label}
          </span>
        )}
      </div>
      <ArrowRight className="h-4 w-4 text-ds-muted group-hover:text-ds-primary transition-colors self-center shrink-0" />
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminDashboardPage() {
  // Resolve the current admin's tenantId from session (supports both superadmin and tenant admin)
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as (typeof session & { user: { tenantId?: string | null; isSuperAdmin?: boolean } })["user"] | undefined;
  const tenantId: string | null =
    sessionUser?.isSuperAdmin
      ? (process.env.DEFAULT_TENANT_ID ?? null)
      : (sessionUser?.tenantId ?? process.env.DEFAULT_TENANT_ID ?? null);

  // Fetch tenant branding for the dashboard header
  const { prisma } = await import("@/lib/prisma");
  const org = tenantId
    ? await prisma.organization.findUnique({
        where: { id: tenantId },
        select: { name: true, siteName: true, logoUrl: true, primaryColor: true },
      })
    : null;

  const orgDisplayName = org?.siteName ?? org?.name ?? null;
  const orgPrimaryColor = org?.primaryColor ?? null;

  const [stats, revenue, pipeline, recentActivity, messageCount] =
    await Promise.all([
      getAnalyticsStats(tenantId),
      getRevenueSnapshot(tenantId),
      getEnrollmentPipeline(tenantId),
      getRecentActivity(8, tenantId),
      getContactMessageCount(),
    ]);

  const totalCourses = stats.enrollmentsByCourse.length;

  return (
    <>
      {/* Tenant branding banner (shown for tenant admins) */}
      {orgDisplayName && (
        <div
          className="rounded-xl px-5 py-3.5 mb-6 flex items-center gap-3 text-white"
          style={{
            background: orgPrimaryColor
              ? `linear-gradient(135deg, ${orgPrimaryColor} 0%, ${orgPrimaryColor}cc 100%)`
              : "linear-gradient(135deg, #1e3a8a 0%, #1e40afcc 100%)",
          }}
        >
          {org?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={org.logoUrl}
              alt={orgDisplayName}
              className="h-7 w-auto object-contain brightness-0 invert shrink-0"
            />
          ) : null}
          <div>
            <p className="font-semibold text-sm leading-none">{orgDisplayName}</p>
            <p className="text-white/70 text-xs mt-0.5">Tenant Admin Dashboard</p>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-ds-text">Dashboard</h1>
        <p className="text-sm text-ds-muted mt-0.5">
          Platform overview — click any card to manage that module
        </p>
      </div>

      {/* ── Module Cards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-7">
        <ModuleCard
          href="/admin/users"
          icon={Users}
          iconClass="text-blue-700"
          bgClass="bg-blue-50"
          title="Users"
          value={stats.approvedCount}
          sub="Active accounts"
        />
        <ModuleCard
          href="/admin/enrollees"
          icon={UserCheck}
          iconClass="text-amber-600"
          bgClass="bg-amber-50"
          title="Enrollment"
          value={pipeline.pending}
          sub="Pending review"
          badge={
            pipeline.enrolled > 0
              ? {
                  label: "enrolled",
                  value: pipeline.enrolled,
                  color: "bg-emerald-50 text-emerald-700 border border-emerald-200",
                }
              : null
          }
        />
        <ModuleCard
          href="/admin/payments"
          icon={CreditCard}
          iconClass="text-rose-600"
          bgClass="bg-rose-100"
          title="Payments"
          value={revenue.pendingVerificationCount}
          sub="Pending verification"
          badge={
            revenue.paidPaymentsCount > 0
              ? {
                  label: "completed",
                  value: revenue.paidPaymentsCount,
                  color: "bg-emerald-50 text-emerald-700 border border-emerald-200",
                }
              : null
          }
        />
        <ModuleCard
          href="/admin/courses"
          icon={BookOpen}
          iconClass="text-blue-700"
          bgClass="bg-blue-50"
          title="Courses"
          value={totalCourses}
          sub="Active courses"
        />
        <ModuleCard
          href="/admin/communications"
          icon={MessageSquare}
          iconClass="text-teal-700"
          bgClass="bg-teal-50"
          title="Messages"
          value={messageCount}
          sub="Contact messages"
        />
        <ModuleCard
          href="/admin/reports"
          icon={BarChart3}
          iconClass="text-indigo-700"
          bgClass="bg-indigo-50"
          title="Reports"
          value={stats.recentEnrollments}
          sub="New enrollments this month"
        />
      </div>

      {/* ── Quick Actions ── */}
      <div className="flex flex-wrap gap-3 mb-7">
        <Link
          href="/admin/enrollees"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Approve Enrollment
        </Link>
        <Link
          href="/admin/payments"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors"
        >
          <FileSearch className="h-4 w-4" />
          Verify Payment
        </Link>
        <Link
          href="/admin/courses"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Course
        </Link>
      </div>

      {/* ── Recent Activity ── */}
      <div className="bg-ds-card rounded-2xl border border-ds-border shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-ds-text flex items-center gap-2">
            <Activity className="h-4 w-4 text-ds-primary" />
            Recent Activity
          </h2>
          <span className="text-xs text-ds-muted">Last 7 days</span>
        </div>

        {recentActivity.length > 0 ? (
          <div className="space-y-1">
            {recentActivity.map((activity) => {
              const IconComponent =
                ACTIVITY_ICONS[activity.type] ?? Activity;
              const colorClass =
                ACTIVITY_COLORS[activity.type] ?? "text-ds-muted bg-slate-50";
              return (
                <Link
                  key={`${activity.type}-${activity.id}`}
                  href={activity.href}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-ds-card transition-colors group"
                >
                  <div className={`rounded-lg p-1.5 shrink-0 ${colorClass}`}>
                    <IconComponent className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ds-text leading-snug truncate group-hover:text-ds-primary transition-colors">
                      {activity.description}
                    </p>
                    <p className="text-xs text-ds-muted mt-0.5">
                      {timeAgo(activity.timestamp)}
                    </p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-ds-muted group-hover:text-ds-primary transition-colors self-center shrink-0" />
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-ds-muted">
            <Activity className="h-8 w-8 mb-3 opacity-40" />
            <p className="text-sm">No activity in the last 7 days</p>
            <Link
              href="/admin/enrollees"
              className="mt-3 text-sm text-ds-primary hover:underline"
            >
              Review pending enrollments →
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
