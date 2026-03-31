import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BarChart3, Users, Building2, GraduationCap, Activity } from "lucide-react";
import { getPlatformStatsForHumiAdmin } from "@/lib/repositories/humi-admin.repository";

export const metadata = { title: "Platform Monitoring | HUMI Admin" };

export default async function HumiAdminMonitoringPage() {
  const session = await getServerSession(authOptions);
  const permissions = session?.user?.humiAdminPermissions;

  if (!session?.user || !session.user.isHumiAdmin) {
    redirect("/humi-admin/login");
  }

  if (!permissions?.canMonitorPlatform) {
    redirect("/humi-admin");
  }

  const stats = await getPlatformStatsForHumiAdmin();

  const metrics = [
    { label: "Total Tenants",    value: stats.totalTenants,    icon: Building2,    color: "text-blue-600",   bg: "bg-blue-50" },
    { label: "Active Tenants",   value: stats.activeTenants,   icon: Activity,     color: "text-green-600",  bg: "bg-green-50" },
    { label: "Pending Tenants",  value: stats.pendingTenants,  icon: Building2,    color: "text-amber-600",  bg: "bg-amber-50" },
    { label: "Active Students",  value: stats.totalStudents,   icon: Users,        color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Open Tickets",     value: stats.openTickets,     icon: GraduationCap, color: "text-red-600",   bg: "bg-red-50" },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <BarChart3 className="w-6 h-6 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Monitoring</h1>
          <p className="text-slate-500 text-sm">High-level platform health metrics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
              <div className={`w-11 h-11 ${m.bg} rounded-xl flex items-center justify-center mb-4`}>
                <Icon className={`w-5 h-5 ${m.color}`} />
              </div>
              <p className="text-3xl font-bold text-slate-900">{m.value.toLocaleString()}</p>
              <p className="text-sm text-slate-500 mt-1">{m.label}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-5">
        <p className="text-blue-700 text-sm font-medium">ℹ️ Read-only view</p>
        <p className="text-blue-600 text-xs mt-1">
          Platform monitoring shows aggregate counts only. No tenant-specific data is accessible from this view.
        </p>
      </div>
    </div>
  );
}
