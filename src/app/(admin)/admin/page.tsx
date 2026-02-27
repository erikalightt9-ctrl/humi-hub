import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { Users, Clock, CheckCircle2, XCircle, TrendingUp } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AnalyticsCard } from "@/components/admin/AnalyticsCard";
import { getAnalyticsStats } from "@/lib/repositories/admin.repository";

export const metadata: Metadata = { title: "Dashboard | VA Admin" };

export default async function AdminDashboardPage() {
  const stats = await getAnalyticsStats();

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of enrollment activity</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <AnalyticsCard
          title="Total Enrollments"
          value={stats.totalEnrollments}
          icon={Users}
          colorClass="text-blue-600 bg-blue-100"
          subtitle="All time"
        />
        <AnalyticsCard
          title="Pending Review"
          value={stats.pendingCount}
          icon={Clock}
          colorClass="text-amber-600 bg-amber-100"
          subtitle="Awaiting decision"
        />
        <AnalyticsCard
          title="Approved"
          value={stats.approvedCount}
          icon={CheckCircle2}
          colorClass="text-green-600 bg-green-100"
          subtitle="All time"
        />
        <AnalyticsCard
          title="Recent (30 days)"
          value={stats.recentEnrollments}
          icon={TrendingUp}
          colorClass="text-purple-600 bg-purple-100"
          subtitle="Last 30 days"
        />
      </div>

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
    </AdminLayout>
  );
}
