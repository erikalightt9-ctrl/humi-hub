import Link from "next/link";
import { Building2, Plus, CheckCircle2, XCircle, Crown } from "lucide-react";
import { getAllTenantsWithStats } from "@/lib/repositories/superadmin.repository";
import { Button } from "@/components/ui/button";

const PLAN_BADGE: Record<string, string> = {
  TRIAL: "bg-amber-900/40 text-amber-400",
  STARTER: "bg-blue-900/40 text-blue-400",
  PROFESSIONAL: "bg-purple-900/40 text-purple-400",
  ENTERPRISE: "bg-emerald-900/40 text-emerald-400",
};

export default async function TenantsPage() {
  const tenants = await getAllTenantsWithStats().catch(() => []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ds-text">Tenants</h1>
          <p className="text-sm text-ds-muted mt-1">{tenants.length} tenant(s) registered</p>
        </div>
        <Button asChild size="sm" className="gap-1.5">
          <Link href="/superadmin/tenants/new">
            <Plus className="h-4 w-4" />
            New Tenant
          </Link>
        </Button>
      </div>

      <div className="bg-ds-card rounded-xl border border-ds-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ds-border bg-ds-surface">
              <th className="text-left px-4 py-3 font-medium text-ds-muted">Tenant</th>
              <th className="text-left px-4 py-3 font-medium text-ds-muted">Subdomain</th>
              <th className="text-left px-4 py-3 font-medium text-ds-muted">Plan</th>
              <th className="text-right px-4 py-3 font-medium text-ds-muted">Students</th>
              <th className="text-right px-4 py-3 font-medium text-ds-muted">Courses</th>
              <th className="text-center px-4 py-3 font-medium text-ds-muted">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ds-border">
            {tenants.map((t) => (
              <tr key={t.id} className="hover:bg-ds-surface">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-ds-muted flex-shrink-0" />
                    <div>
                      <p className="font-medium text-ds-text">{t.name}</p>
                      <p className="text-xs text-ds-muted">{t.email}</p>
                    </div>
                    {t.isDefault && (
                      <span className="inline-flex items-center gap-1 text-xs bg-violet-900/40 text-violet-400 px-1.5 py-0.5 rounded-full">
                        <Crown className="h-3 w-3" />
                        Default
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-ds-muted font-mono text-xs">
                  {t.subdomain ?? <span className="text-ds-muted opacity-50">—</span>}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${PLAN_BADGE[t.plan] ?? "bg-ds-surface text-ds-muted"}`}
                  >
                    {t.plan}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-ds-text">{t._count.students}</td>
                <td className="px-4 py-3 text-right text-ds-text">{t._count.courses}</td>
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
                    className="text-xs text-violet-400 hover:underline"
                  >
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {tenants.length === 0 && (
          <div className="text-center py-12 text-ds-muted">
            <Building2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No tenants yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
