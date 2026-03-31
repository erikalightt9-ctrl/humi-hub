import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Building2,
  Users,
  TicketCheck,
  TrendingUp,
  Shield,
  Clock,
} from "lucide-react";
import { getPlatformStatsForHumiAdmin } from "@/lib/repositories/humi-admin.repository";
import type { HumiAdminPermissions } from "@/types/next-auth";

export const metadata = { title: "Dashboard | HUMI Admin" };

export default async function HumiAdminDashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as typeof session.user & { isHumiAdmin?: boolean }).isHumiAdmin) {
    redirect("/humi-admin/login");
  }

  const permissions = (session.user as typeof session.user & {
    humiAdminPermissions: HumiAdminPermissions | null;
  }).humiAdminPermissions;

  const stats = await getPlatformStatsForHumiAdmin();

  const kpis = [
    {
      label: "Total Tenants",
      value: stats.totalTenants,
      sub: `${stats.activeTenants} active`,
      icon: Building2,
      color: "text-blue-600",
      bg: "bg-blue-50",
      show: true,
    },
    {
      label: "Pending Tenants",
      value: stats.pendingTenants,
      sub: "awaiting review",
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
      show: permissions?.canReviewTenants ?? false,
    },
    {
      label: "Active Students",
      value: stats.totalStudents,
      sub: "across all tenants",
      icon: Users,
      color: "text-green-600",
      bg: "bg-green-50",
      show: permissions?.canMonitorPlatform ?? false,
    },
    {
      label: "Open Tickets",
      value: stats.openTickets,
      sub: "pending support",
      icon: TicketCheck,
      color: "text-red-600",
      bg: "bg-red-50",
      show: permissions?.canProvideSupport ?? false,
    },
  ].filter((k) => k.show);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Dashboard</h1>
          <p className="text-slate-500 text-sm">
            Welcome, {session.user.name} — HUMI Hub Support Staff
          </p>
        </div>
      </div>

      {/* KPI Grid */}
      {kpis.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
                <div className={`w-10 h-10 ${kpi.bg} rounded-lg flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                <p className="text-2xl font-bold text-slate-900">{kpi.value.toLocaleString()}</p>
                <p className="text-sm font-medium text-slate-700 mt-0.5">{kpi.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{kpi.sub}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 p-8 text-center mb-10">
          <TrendingUp className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">
            No statistics available for your current permissions.
          </p>
        </div>
      )}

      {/* Permissions summary */}
      <div className="bg-white rounded-xl border border-slate-100 p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Your Access Permissions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { key: "canReviewTenants",   label: "Tenant Review" },
            { key: "canOnboardTenants",  label: "Onboarding" },
            { key: "canMonitorPlatform", label: "Platform Monitoring" },
            { key: "canProvideSupport",  label: "Support" },
            { key: "canManageContent",   label: "Content Management" },
          ].map((perm) => {
            const enabled = permissions?.[perm.key as keyof HumiAdminPermissions] ?? false;
            return (
              <div
                key={perm.key}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  enabled
                    ? "bg-green-50 text-green-700 border border-green-100"
                    : "bg-slate-50 text-slate-400 border border-slate-100"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${enabled ? "bg-green-500" : "bg-slate-300"}`} />
                {perm.label}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
