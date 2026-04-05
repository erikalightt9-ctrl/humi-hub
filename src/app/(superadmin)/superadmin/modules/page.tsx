"use client";

import { useEffect, useState, useCallback } from "react";
import {
  GraduationCap,
  Users,
  Landmark,
  Megaphone,
  Package,
  TrendingUp,
  Monitor,
  Loader2,
  AlertCircle,
  Search,
  Building2,
} from "lucide-react";
import type { ModuleKey } from "@/lib/modules";

/* ------------------------------------------------------------------ */
/*  Icon map — resolves iconName strings from module config            */
/* ------------------------------------------------------------------ */

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  GraduationCap,
  Users,
  Landmark,
  Megaphone,
  Package,
  TrendingUp,
  Monitor,
};

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface ModuleMeta {
  key: ModuleKey;
  label: string;
  description: string;
  badge: string;
  defaultEnabled: boolean;
}

interface TenantRow {
  tenantId: string;
  tenantName: string;
  slug: string;
  plan: string;
  isActive: boolean;
  modules: Record<ModuleKey, boolean>;
}

interface ApiResponse {
  success: boolean;
  data: { tenants: TenantRow[]; moduleList: ModuleMeta[] };
}

const PLAN_COLORS: Record<string, string> = {
  TRIAL: "bg-amber-50 text-amber-700 border-amber-200",
  STARTER: "bg-blue-50 text-blue-700 border-blue-200",
  PROFESSIONAL: "bg-purple-50 text-purple-700 border-purple-200",
  ENTERPRISE: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

/* ------------------------------------------------------------------ */
/*  Toggle component                                                    */
/* ------------------------------------------------------------------ */

function Toggle({
  enabled,
  loading,
  onChange,
}: {
  enabled: boolean;
  loading: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      disabled={loading}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1 ${
        enabled ? "bg-indigo-600" : "bg-slate-200"
      } ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      aria-checked={enabled}
      role="switch"
    >
      {loading ? (
        <Loader2 className="h-3 w-3 text-white animate-spin absolute left-1/2 -translate-x-1/2" />
      ) : (
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
            enabled ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function ModulesPage() {
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [moduleList, setModuleList] = useState<ModuleMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  // key = `${tenantId}:${moduleKey}`, value = true while saving
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/superadmin/modules");
      const json: ApiResponse = await res.json();
      if (!json.success) throw new Error("Failed to load");
      setTenants(json.data.tenants);
      setModuleList(json.data.moduleList);
    } catch {
      setError("Failed to load module data. Please retry.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = tenants.filter(
    (t) =>
      t.tenantName.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase())
  );

  async function handleToggle(tenantId: string, moduleKey: ModuleKey, currentEnabled: boolean) {
    const saveKey = `${tenantId}:${moduleKey}`;
    setSaving((s) => ({ ...s, [saveKey]: true }));

    // Optimistic update
    setTenants((prev) =>
      prev.map((t) =>
        t.tenantId === tenantId
          ? { ...t, modules: { ...t.modules, [moduleKey]: !currentEnabled } }
          : t
      )
    );

    try {
      const res = await fetch("/api/superadmin/modules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, moduleKey, enabled: !currentEnabled }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    } catch {
      // Revert on failure
      setTenants((prev) =>
        prev.map((t) =>
          t.tenantId === tenantId
            ? { ...t, modules: { ...t.modules, [moduleKey]: currentEnabled } }
            : t
        )
      );
      setError("Failed to update module. Please retry.");
    } finally {
      setSaving((s) => {
        const { [saveKey]: _, ...rest } = s;
        return rest;
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Module Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Enable or disable platform modules per tenant. Tenants only see enabled modules.
          </p>
        </div>
        <div className="text-xs text-slate-500 text-right shrink-0">
          <p className="font-semibold text-slate-700">{tenants.length} tenants</p>
          <p>{moduleList.length} modules</p>
        </div>
      </div>

      {/* Module legend */}
      <div className="flex flex-wrap gap-2">
        {moduleList.map((m) => {
          const Icon = ICON_MAP[
            {
              module_lms: "GraduationCap",
              module_hr: "Users",
              module_accounting: "Landmark",
              module_marketing: "Megaphone",
              module_inventory: "Package",
              module_sales: "TrendingUp",
              module_it: "Monitor",
            }[m.key] as string
          ] ?? Building2;
          return (
            <div
              key={m.key}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${m.badge}`}
              title={m.description}
            >
              <Icon className="h-3 w-3" />
              {m.label}
              {m.defaultEnabled && (
                <span className="opacity-60 text-[10px]">default</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 flex-1">{error}</p>
          <button className="text-xs text-red-600 underline" onClick={fetchData}>
            Retry
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search tenants..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      {/* Matrix table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Building2 className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm">No tenants found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide sticky left-0 bg-slate-50 z-10 min-w-[180px]">
                    Tenant
                  </th>
                  {moduleList.map((m) => {
                    const Icon = ICON_MAP[
                      {
                        module_lms: "GraduationCap",
                        module_hr: "Users",
                        module_accounting: "Landmark",
                        module_marketing: "Megaphone",
                        module_inventory: "Package",
                        module_sales: "TrendingUp",
                        module_it: "Monitor",
                      }[m.key] as string
                    ] ?? Building2;
                    return (
                      <th
                        key={m.key}
                        className="px-4 py-3 text-center min-w-[90px]"
                        title={m.description}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <Icon className="h-3.5 w-3.5 text-slate-400" />
                          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full border ${m.badge}`}>
                            {m.label}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((tenant) => (
                  <tr key={tenant.tenantId} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 sticky left-0 bg-white hover:bg-slate-50 z-10">
                      <div>
                        <p className="font-medium text-slate-900">{tenant.tenantName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-slate-400 font-mono">{tenant.slug}</p>
                          <span
                            className={`inline-flex text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${
                              PLAN_COLORS[tenant.plan] ?? "bg-slate-50 text-slate-500 border-slate-200"
                            }`}
                          >
                            {tenant.plan}
                          </span>
                          {!tenant.isActive && (
                            <span className="text-[10px] text-slate-400 italic">inactive</span>
                          )}
                        </div>
                      </div>
                    </td>
                    {moduleList.map((m) => {
                      const enabled = tenant.modules[m.key] ?? m.defaultEnabled;
                      const saveKey = `${tenant.tenantId}:${m.key}`;
                      return (
                        <td key={m.key} className="px-4 py-3 text-center">
                          <div className="flex justify-center">
                            <Toggle
                              enabled={enabled}
                              loading={!!saving[saveKey]}
                              onChange={() => handleToggle(tenant.tenantId, m.key, enabled)}
                            />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
