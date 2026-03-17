import { getPlatformAnalytics } from "@/lib/repositories/superadmin.repository";
import { BarChart3, Building2, Users, BookOpen, ShieldAlert } from "lucide-react";

export default async function SuperAdminAnalyticsPage() {
  const analytics = await getPlatformAnalytics().catch(() => null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Platform Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Aggregate metrics across all tenants</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Tenants", value: analytics?.tenantCount, icon: Building2, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Active Tenants", value: analytics?.activeTenants, icon: BarChart3, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Trial Tenants", value: analytics?.trialTenants, icon: ShieldAlert, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Total Students", value: analytics?.totalStudents, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-500">{label}</p>
              <span className={`p-2 rounded-lg ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{value ?? "—"}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="h-4 w-4 text-slate-400" />
          <h2 className="font-semibold text-slate-800">Active Courses (Platform-wide)</h2>
        </div>
        <p className="text-3xl font-bold text-slate-900">{analytics?.totalCourses ?? "—"}</p>
        <p className="text-sm text-slate-500 mt-1">Across all tenants</p>
      </div>
    </div>
  );
}
