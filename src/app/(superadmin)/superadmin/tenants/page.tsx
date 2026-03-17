import Link from "next/link";
import { Building2, Plus, CheckCircle2, XCircle, Crown } from "lucide-react";
import { getAllTenantsWithStats } from "@/lib/repositories/superadmin.repository";
import { Button } from "@/components/ui/button";

const PLAN_BADGE: Record<string, string> = {
  TRIAL: "bg-amber-100 text-amber-700",
  STARTER: "bg-blue-100 text-blue-700",
  PROFESSIONAL: "bg-purple-100 text-purple-700",
  ENTERPRISE: "bg-emerald-100 text-emerald-700",
};

export default async function TenantsPage() {
  const tenants = await getAllTenantsWithStats().catch(() => []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tenants</h1>
          <p className="text-sm text-slate-500 mt-1">{tenants.length} tenant(s) registered</p>
        </div>
        <Button asChild size="sm" className="gap-1.5">
          <Link href="/superadmin/tenants/new">
            <Plus className="h-4 w-4" />
            New Tenant
          </Link>
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-3 font-medium text-slate-500">Tenant</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Subdomain</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Plan</th>
              <th className="text-right px-4 py-3 font-medium text-slate-500">Students</th>
              <th className="text-right px-4 py-3 font-medium text-slate-500">Courses</th>
              <th className="text-center px-4 py-3 font-medium text-slate-500">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tenants.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-slate-900">{t.name}</p>
                      <p className="text-xs text-slate-400">{t.email}</p>
                    </div>
                    {t.isDefault && (
                      <span className="inline-flex items-center gap-1 text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">
                        <Crown className="h-3 w-3" />
                        Default
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                  {t.subdomain ?? <span className="text-slate-300">—</span>}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${PLAN_BADGE[t.plan] ?? "bg-slate-100 text-slate-600"}`}
                  >
                    {t.plan}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-slate-700">{t._count.students}</td>
                <td className="px-4 py-3 text-right text-slate-700">{t._count.courses}</td>
                <td className="px-4 py-3 text-center">
                  {t.isActive ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-400 mx-auto" />
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/superadmin/tenants/${t.id}`}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {tenants.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Building2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No tenants yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
