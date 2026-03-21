import type { Metadata } from "next";
export const dynamic = "force-dynamic";

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

export const metadata: Metadata = { title: "Dashboard | HUMI Admin" };

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
  enrollment: "text-blue-600 bg-blue-100",
  payment: "text-emerald-600 bg-emerald-100",
  certificate: "text-purple-600 bg-purple-100",
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
      className="group bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-start gap-4 hover:border-blue-300 hover:shadow-md transition-all"
    >
      <div className={`rounded-xl p-2.5 shrink-0 ${bgClass}`}>
        <Icon className={`h-5 w-5 ${iconClass}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-xs text-gray-400 mt-1.5">{sub}</p>
        {badge && badge.value > 0 && (
          <span
            className={`inline-flex items-center mt-2 px-2 py-0.5 rounded-full text-xs font-semibold ${badge.color}`}
          >
            {badge.value} {badge.label}
          </span>
        )}
      </div>
      <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 transition-colors self-center shrink-0" />
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminDashboardPage() {
  const [stats, revenue, pipeline, recentActivity, messageCount] =
    await Promise.all([
      getAnalyticsStats(process.env.DEFAULT_TENANT_ID ?? null),
      getRevenueSnapshot(),
      getEnrollmentPipeline(),
      getRecentActivity(8),
      getContactMessageCount(),
    ]);

  const totalCourses = stats.enrollmentsByCourse.length;

  return (
    <>
      {/* Page header */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Platform overview — click any card to manage that module
        </p>
      </div>

      {/* ── Module Cards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-7">
        <ModuleCard
          href="/admin/users"
          icon={Users}
          iconClass="text-blue-600"
          bgClass="bg-blue-100"
          title="Users"
          value={stats.approvedCount}
          sub="Active accounts"
        />
        <ModuleCard
          href="/admin/enrollees"
          icon={UserCheck}
          iconClass="text-amber-600"
          bgClass="bg-amber-100"
          title="Enrollment"
          value={pipeline.pending}
          sub="Pending review"
          badge={
            pipeline.enrolled > 0
              ? {
                  label: "enrolled",
                  value: pipeline.enrolled,
                  color: "bg-emerald-100 text-emerald-700",
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
                  color: "bg-emerald-100 text-emerald-700",
                }
              : null
          }
        />
        <ModuleCard
          href="/admin/courses"
          icon={BookOpen}
          iconClass="text-purple-600"
          bgClass="bg-purple-100"
          title="Courses"
          value={totalCourses}
          sub="Active courses"
        />
        <ModuleCard
          href="/admin/communications"
          icon={MessageSquare}
          iconClass="text-teal-600"
          bgClass="bg-teal-100"
          title="Messages"
          value={messageCount}
          sub="Contact messages"
        />
        <ModuleCard
          href="/admin/reports"
          icon={BarChart3}
          iconClass="text-indigo-600"
          bgClass="bg-indigo-100"
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
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Course
        </Link>
      </div>

      {/* ── Recent Activity ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-600" />
            Recent Activity
          </h2>
          <span className="text-xs text-gray-400">Last 7 days</span>
        </div>

        {recentActivity.length > 0 ? (
          <div className="space-y-1">
            {recentActivity.map((activity) => {
              const IconComponent =
                ACTIVITY_ICONS[activity.type] ?? Activity;
              const colorClass =
                ACTIVITY_COLORS[activity.type] ?? "text-gray-600 bg-gray-100";
              return (
                <Link
                  key={`${activity.type}-${activity.id}`}
                  href={activity.href}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className={`rounded-lg p-1.5 shrink-0 ${colorClass}`}>
                    <IconComponent className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 leading-snug truncate group-hover:text-blue-600 transition-colors">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {timeAgo(activity.timestamp)}
                    </p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-blue-500 transition-colors self-center shrink-0" />
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Activity className="h-8 w-8 mb-3 opacity-40" />
            <p className="text-sm">No activity in the last 7 days</p>
            <Link
              href="/admin/enrollees"
              className="mt-3 text-sm text-blue-600 hover:underline"
            >
              Review pending enrollments →
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
