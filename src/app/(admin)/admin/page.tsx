import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  Users,
  Clock,
  TrendingUp,
  ClipboardCheck,
  CalendarClock,
  DollarSign,
  UserPlus,
  FileSearch,
  Plus,
  CreditCard,
  Award,
  Activity,
} from "lucide-react";
import { AnalyticsCard } from "@/components/admin/AnalyticsCard";
import { EnrollmentPipeline } from "@/components/admin/EnrollmentPipeline";
import { ScheduleStatusBadge } from "@/components/admin/ScheduleStatusBadge";
import { Progress } from "@/components/ui/progress";
import { getAnalyticsStats } from "@/lib/repositories/admin.repository";
import { getPresentNowCount } from "@/lib/repositories/attendance.repository";
import { getScheduleStats, getUpcomingSchedules } from "@/lib/repositories/schedule.repository";
import {
  getRevenueSnapshot,
  getEnrollmentPipeline,
  getRecentActivity,
  getCurrentlyPresent,
} from "@/lib/repositories/dashboard.repository";

export const metadata: Metadata = { title: "Dashboard | HUMI Admin" };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number): string {
  return `₱${value.toLocaleString()}`;
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
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
// Page
// ---------------------------------------------------------------------------

export default async function AdminDashboardPage() {
  const [stats, presentNow, scheduleStats, upcomingSchedules, revenue, pipeline, recentActivity, presentStudents] =
    await Promise.all([
      getAnalyticsStats(process.env.DEFAULT_TENANT_ID ?? ""),
      getPresentNowCount(),
      getScheduleStats(),
      getUpcomingSchedules(5),
      getRevenueSnapshot(),
      getEnrollmentPipeline(),
      getRecentActivity(10),
      getCurrentlyPresent(),
    ]);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Platform overview &amp; enrollment activity
        </p>
      </div>

      {/* Revenue + Key Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <AnalyticsCard
          title="Total Revenue"
          value={formatCurrency(revenue.totalRevenue)}
          icon={DollarSign}
          colorClass="text-emerald-600 bg-emerald-100"
          subtitle={`${formatCurrency(revenue.recentRevenue)} in last 30 days`}
        />
        <AnalyticsCard
          title="Pending Payments"
          value={revenue.pendingVerificationCount}
          icon={Clock}
          colorClass="text-amber-600 bg-amber-100"
          subtitle="Awaiting verification"
        />
        <AnalyticsCard
          title="Total Students"
          value={stats.approvedCount}
          icon={Users}
          colorClass="text-blue-600 bg-blue-100"
          subtitle="Active accounts"
        />
        <AnalyticsCard
          title="New Enrollments"
          value={stats.recentEnrollments}
          icon={TrendingUp}
          colorClass="text-purple-600 bg-purple-100"
          subtitle="Last 30 days"
        />
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Link
          href="/admin/enrollees"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Approve Enrollment
        </Link>
        <Link
          href="/admin/payments"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          <FileSearch className="h-4 w-4" />
          Verify Payment
        </Link>
        <Link
          href="/admin/courses"
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Course
        </Link>
      </div>

      {/* Enrollment Pipeline */}
      <EnrollmentPipeline pipeline={pipeline} />

      {/* Live Attendance Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-green-600" />
            Live Attendance
          </h2>
          <Link
            href="/admin/attendance"
            className="text-sm text-blue-600 hover:underline"
          >
            View full records →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-700">{presentNow}</p>
            <p className="text-xs font-medium text-green-600">Present Now</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-gray-700">
              {stats.approvedCount - presentNow > 0
                ? stats.approvedCount - presentNow
                : 0}
            </p>
            <p className="text-xs font-medium text-gray-500">Not Clocked In</p>
          </div>
        </div>

        {presentStudents.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {presentStudents.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {student.studentName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {student.courseTitle}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-green-700 font-mono shrink-0 ml-3">
                  {new Date(student.clockIn).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">
            No students clocked in right now.
          </p>
        )}
      </div>

      {/* Two column layout for course breakdown + activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Course breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Enrollments by Course</h2>
          <div className="space-y-4">
            {stats.enrollmentsByCourse.map((course) => {
              const pct =
                stats.totalEnrollments > 0
                  ? Math.round((course.count / stats.totalEnrollments) * 100)
                  : 0;
              return (
                <div key={course.slug}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{course.title}</span>
                    <span className="text-gray-500">
                      {course.count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Recent Activity
            </h2>
            <span className="text-xs text-gray-400">Last 7 days</span>
          </div>

          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity) => {
                const IconComponent = ACTIVITY_ICONS[activity.type] ?? Activity;
                const colorClass = ACTIVITY_COLORS[activity.type] ?? "text-gray-600 bg-gray-100";
                return (
                  <Link
                    key={`${activity.type}-${activity.id}`}
                    href={activity.href}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className={`rounded-lg p-1.5 shrink-0 ${colorClass}`}>
                      <IconComponent className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 leading-snug truncate">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {timeAgo(activity.timestamp)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">
              No recent activity in the last 7 days.
            </p>
          )}
        </div>
      </div>

      {/* Training Batches */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-blue-600" />
            Training Batches
          </h2>
          <Link
            href="/admin/schedules"
            className="text-sm text-blue-600 hover:underline"
          >
            View all →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-xs text-blue-600">Active Batches</p>
            <p className="text-lg font-bold text-blue-900">{scheduleStats.totalActive}</p>
          </div>
          <div className="bg-indigo-50 rounded-lg p-3 text-center">
            <p className="text-xs text-indigo-600">Students</p>
            <p className="text-lg font-bold text-indigo-900">{scheduleStats.totalStudents}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-xs text-green-600">Available Slots</p>
            <p className="text-lg font-bold text-green-900">{scheduleStats.availableSlots}</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 text-center">
            <p className="text-xs text-amber-600">Starting Soon</p>
            <p className="text-lg font-bold text-amber-900">{scheduleStats.upcomingStarts}</p>
          </div>
        </div>

        {upcomingSchedules.length > 0 ? (
          <div className="space-y-2">
            {upcomingSchedules.map((s) => {
              const enrolled = s._count.students;
              const pct = s.maxCapacity > 0
                ? Math.round((enrolled / s.maxCapacity) * 100)
                : 0;
              return (
                <Link
                  key={s.id}
                  href={`/admin/schedules/${s.id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {s.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {s.course.title} · Starts{" "}
                      {new Date(s.startDate).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    <div className="flex items-center gap-2">
                      <Progress value={pct} className="h-2 w-12" />
                      <span className="text-xs text-gray-500">
                        {enrolled}/{s.maxCapacity}
                      </span>
                    </div>
                    <ScheduleStatusBadge status={s.status} />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">
            No upcoming training batches.{" "}
            <Link href="/admin/schedules" className="text-blue-600 hover:underline">
              Create one
            </Link>
          </p>
        )}
      </div>
    </>
  );
}
