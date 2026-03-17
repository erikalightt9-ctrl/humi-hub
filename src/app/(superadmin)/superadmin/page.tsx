import { Building2, Users, BookOpen, TrendingUp, ShieldAlert } from "lucide-react";
import { getPlatformAnalytics } from "@/lib/repositories/superadmin.repository";

export default async function SuperAdminDashboard() {
  const analytics = await getPlatformAnalytics().catch(() => null);

  const stats = [
    {
      label: "Total Tenants",
      value: analytics?.tenantCount ?? "—",
      sub: `${analytics?.activeTenants ?? 0} active`,
      icon: Building2,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Trial Tenants",
      value: analytics?.trialTenants ?? "—",
      sub: "On free trial",
      icon: ShieldAlert,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Total Students",
      value: analytics?.totalStudents ?? "—",
      sub: "Across all tenants",
      icon: Users,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Active Courses",
      value: analytics?.totalCourses ?? "—",
      sub: "Platform-wide",
      icon: BookOpen,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Platform Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          System-wide overview. You cannot view or edit individual tenant content.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-500">{label}</p>
              <span className={`p-2 rounded-lg ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <TrendingUp className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Super Admin Restrictions</p>
          <p className="text-xs text-amber-700 mt-1">
            As Super Admin you can manage tenants, plans, and platform settings. You cannot view
            tenant courses, student records, submissions, or any tenant-specific content.
          </p>
        </div>
      </div>
    </div>
  );
}
