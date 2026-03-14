import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOrganizationAnalytics } from "@/lib/repositories/organization.repository";
import { BarChart3, Users, Award, BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "Analytics | HUMI Corporate",
};

export default async function CorporateAnalyticsPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string; organizationId?: string } | undefined;

  if (!user || user.role !== "corporate" || !user.organizationId) {
    redirect("/corporate/login");
  }

  const analytics = await getOrganizationAnalytics(user.organizationId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-purple-100 rounded-lg p-2">
            <BarChart3 className="h-5 w-5 text-purple-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-sm text-gray-500">
              Employee skill development and training metrics
            </p>
          </div>
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-gray-500">Employees</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {analytics.totalEmployees}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-5 w-5 text-green-500" />
            <span className="text-sm text-gray-500">Avg Quiz Score</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {analytics.avgQuizScore}%
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-5 w-5 text-amber-500" />
            <span className="text-sm text-gray-500">Avg Assignment Score</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {analytics.avgAssignmentScore}/100
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Award className="h-5 w-5 text-purple-500" />
            <span className="text-sm text-gray-500">Certificates</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {analytics.totalCertificates}
          </div>
        </div>
      </div>

      {/* Course breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">
          Employees by Course
        </h2>
        {analytics.courseBreakdown.length === 0 ? (
          <p className="text-sm text-gray-500">No course data available yet.</p>
        ) : (
          <div className="space-y-3">
            {analytics.courseBreakdown.map((item) => {
              const pct =
                analytics.totalEmployees > 0
                  ? Math.round((item.count / analytics.totalEmployees) * 100)
                  : 0;

              return (
                <div key={item.course}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">{item.course}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {item.count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
