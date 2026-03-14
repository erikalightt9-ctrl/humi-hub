"use client";

import {
  Users,
  BookOpen,
  Award,
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
/*  Stat Card                                                          */
/* ------------------------------------------------------------------ */

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  readonly label: string;
  readonly value: number | string;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
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
        <h1 className="text-2xl font-bold text-gray-900">
          {stats.organizationName}
        </h1>
        <p className="text-sm text-gray-500">
          Corporate Upskilling Dashboard
          {stats.industry ? ` \u2022 ${stats.industry}` : ""}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Employees"
          value={stats.totalEmployees}
          icon={Users}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          label="Active Enrollments"
          value={stats.activeEnrollments}
          icon={BookOpen}
          color="bg-green-100 text-green-600"
        />
        <StatCard
          label="Certificates Earned"
          value={stats.certificatesEarned}
          icon={Award}
          color="bg-purple-100 text-purple-600"
        />
        <StatCard
          label="Seats Available"
          value={`${stats.totalEmployees} / ${stats.maxSeats}`}
          icon={TrendingUp}
          color="bg-amber-100 text-amber-600"
        />
      </div>

      {/* Recent enrollments */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-200">
          <ClipboardList className="h-5 w-5 text-gray-500" />
          <h2 className="font-semibold text-gray-900">Recent Enrollments</h2>
        </div>

        {stats.recentEnrollments.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            No enrollments yet. Start by enrolling employees in courses.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {stats.recentEnrollments.map((enrollment) => (
              <div
                key={enrollment.id}
                className="flex items-center justify-between px-5 py-3"
              >
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {enrollment.student?.name ?? "Unknown"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {enrollment.course.title} \u2022 {enrollment.courseTier}
                  </div>
                </div>
                <StatusBadge status={enrollment.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
