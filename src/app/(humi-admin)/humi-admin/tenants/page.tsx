import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Building2, Clock, CheckCircle2, XCircle } from "lucide-react";
import { getPendingTenantApplications, getActiveTenants } from "@/lib/repositories/humi-admin.repository";
import type { HumiAdminPermissions } from "@/types/next-auth";

export const metadata = { title: "Tenant Review | HUMI Admin" };

export default async function HumiAdminTenantsPage() {
  const session = await getServerSession(authOptions);
  const permissions = (session?.user as typeof session?.user & {
    humiAdminPermissions: HumiAdminPermissions | null;
  })?.humiAdminPermissions;

  if (!session?.user || !(session.user as typeof session.user & { isHumiAdmin?: boolean }).isHumiAdmin) {
    redirect("/humi-admin/login");
  }

  if (!permissions?.canReviewTenants) {
    redirect("/humi-admin");
  }

  const [pending, active] = await Promise.all([
    getPendingTenantApplications(),
    getActiveTenants(),
  ]);

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <Building2 className="w-6 h-6 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tenant Review</h1>
          <p className="text-slate-500 text-sm">Review and manage tenant platform applications</p>
        </div>
      </div>

      {/* Pending Applications */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-amber-600" />
          <h2 className="text-base font-semibold text-slate-800">
            Pending Applications ({pending.length})
          </h2>
        </div>

        {pending.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 p-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-green-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No pending applications</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((org) => (
              <div key={org.id} className="bg-white rounded-xl border border-amber-100 p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800">{org.name}</h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Subdomain: <span className="font-mono text-blue-600">{org.subdomain}</span>
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                      <span>Plan: <span className="font-medium text-slate-600">{org.plan ?? "—"}</span></span>
                      <span>Students: {org._count.students}</span>
                      <span>Courses: {org._count.courses}</span>
                      <span>Applied: {new Date(org.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                      Pending
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Active Tenants */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <h2 className="text-base font-semibold text-slate-800">
            Active Tenants ({active.length})
          </h2>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Subdomain</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Plan</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Students</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Courses</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Since</th>
              </tr>
            </thead>
            <tbody>
              {active.map((org) => (
                <tr key={org.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-slate-800">{org.name}</td>
                  <td className="px-5 py-3.5 font-mono text-blue-600 text-xs">{org.subdomain}</td>
                  <td className="px-5 py-3.5 text-slate-600">{org.plan ?? "—"}</td>
                  <td className="px-5 py-3.5 text-slate-600">{org._count.students}</td>
                  <td className="px-5 py-3.5 text-slate-600">{org._count.courses}</td>
                  <td className="px-5 py-3.5 text-slate-400">{new Date(org.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {active.length === 0 && (
            <div className="p-8 text-center">
              <XCircle className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No active tenants yet</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
