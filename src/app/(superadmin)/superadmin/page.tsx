import { Building2, Users, BookOpen, TrendingUp, ShieldAlert, Shield } from "lucide-react";
import { getPlatformAnalytics } from "@/lib/repositories/superadmin.repository";

export default async function SuperAdminDashboard() {
  const analytics = await getPlatformAnalytics().catch(() => null);

  const stats = [
    {
      label: "Total Tenants",
      value: analytics?.tenantCount ?? "—",
      sub: `${analytics?.activeTenants ?? 0} active`,
      icon: Building2,
      color: "text-violet-400",
      bg: "bg-violet-900/40",
    },
    {
      label: "Trial Tenants",
      value: analytics?.trialTenants ?? "—",
      sub: "On free trial",
      icon: ShieldAlert,
      color: "text-amber-400",
      bg: "bg-amber-900/40",
    },
    {
      label: "Total Students",
      value: analytics?.totalStudents ?? "—",
      sub: "Across all tenants",
      icon: Users,
      color: "text-emerald-400",
      bg: "bg-emerald-900/40",
    },
    {
      label: "Active Courses",
      value: analytics?.totalCourses ?? "—",
      sub: "Platform-wide",
      icon: BookOpen,
      color: "text-blue-400",
      bg: "bg-blue-900/40",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-violet-900/20 border border-violet-800/50 rounded-xl px-4 py-3 flex items-center gap-2 mb-6">
        <Shield className="h-4 w-4 text-violet-400" />
        <span className="text-xs font-semibold text-violet-300 uppercase tracking-widest">Platform Administration</span>
        <span className="ml-auto text-xs text-ds-muted">Super Admin View — Tenant data is isolated</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-ds-text">Platform Dashboard</h1>
        <p className="text-sm text-ds-muted mt-1">
          System-wide overview. You cannot view or edit individual tenant content.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="bg-ds-card rounded-xl border border-ds-border p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-ds-muted">{label}</p>
              <span className={`p-2 rounded-lg ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </span>
            </div>
            <p className="text-2xl font-bold text-ds-text">{value}</p>
            <p className="text-xs text-ds-muted mt-1">{sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-amber-900/20 border border-amber-800 rounded-xl p-4 flex items-start gap-3">
        <TrendingUp className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-400">Super Admin Restrictions</p>
          <p className="text-xs text-amber-400/80 mt-1">
            As Super Admin you can manage tenants, plans, and platform settings. You cannot view
            tenant courses, student records, submissions, or any tenant-specific content.
          </p>
        </div>
      </div>
    </div>
  );
}
