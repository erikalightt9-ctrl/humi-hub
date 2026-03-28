"use client";

import { useEffect, useState, useCallback } from "react";
import { ToggleLeft, ToggleRight, Search, Loader2, Building2, AlertCircle } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface TenantFlag {
  readonly tenantId: string;
  readonly tenantName: string;
  readonly subdomain: string | null;
  readonly plan: string;
  readonly flags: Record<string, boolean>;
}

const ALL_FLAGS: ReadonlyArray<{ key: string; label: string; description: string; plans: string[] }> = [
  { key: "ai_tools",          label: "AI Tools",           description: "Summarize, grammar check, quiz generation", plans: ["PROFESSIONAL", "ENTERPRISE"] },
  { key: "white_label",       label: "White-Label",        description: "Custom branding, logo, colors",             plans: ["PROFESSIONAL", "ENTERPRISE"] },
  { key: "custom_domain",     label: "Custom Domain",      description: "Use your own domain name",                   plans: ["ENTERPRISE"] },
  { key: "file_manager",      label: "File Manager",       description: "Upload and manage training files",            plans: ["PROFESSIONAL", "ENTERPRISE"] },
  { key: "reports_export",    label: "Reports Export",     description: "CSV export of enrollment data",              plans: ["PROFESSIONAL", "ENTERPRISE"] },
  { key: "corporate_portal",  label: "Corporate Portal",   description: "B2B corporate team training dashboard",      plans: ["PROFESSIONAL", "ENTERPRISE"] },
  { key: "api_access",        label: "API Access",         description: "REST API for integrations",                  plans: ["ENTERPRISE"] },
  { key: "sso",               label: "SSO / SAML",         description: "Single sign-on for enterprise auth",         plans: ["ENTERPRISE"] },
  { key: "analytics_advanced",label: "Advanced Analytics", description: "Cohort analysis and predictive reporting",   plans: ["ENTERPRISE"] },
];

const PLAN_COLOR: Record<string, string> = {
  TRIAL:        "bg-amber-900/40 text-amber-400",
  STARTER:      "bg-blue-900/40 text-blue-400",
  PROFESSIONAL: "bg-purple-900/40 text-purple-400",
  ENTERPRISE:   "bg-emerald-900/40 text-emerald-400",
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function FeatureFlagsPage() {
  const [tenants, setTenants] = useState<ReadonlyArray<TenantFlag>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/superadmin/feature-flags");
      const json = await r.json();
      if (json.success) setTenants(json.data ?? []);
      else setError(json.error ?? "Failed to load");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function toggleFlag(tenantId: string, flag: string, current: boolean) {
    const key = `${tenantId}:${flag}`;
    setSaving(key);
    setError("");
    try {
      const r = await fetch(`/api/superadmin/feature-flags`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, flag, enabled: !current }),
      });
      const json = await r.json();
      if (json.success) {
        setTenants((prev) =>
          prev.map((t) =>
            t.tenantId === tenantId
              ? { ...t, flags: { ...t.flags, [flag]: !current } }
              : t,
          ),
        );
      } else {
        setError(json.error ?? "Failed to update");
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(null);
    }
  }

  const filtered = tenants.filter(
    (t) =>
      t.tenantName.toLowerCase().includes(search.toLowerCase()) ||
      (t.subdomain ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-ds-text">Feature Flags</h1>
        <p className="text-sm text-ds-muted mt-0.5">
          Enable or disable features per tenant. Changes take effect immediately.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-xl px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ds-muted" />
        <input
          type="text"
          placeholder="Search tenants…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm bg-ds-surface border border-ds-border text-ds-text rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 placeholder:text-ds-muted"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-sm text-ds-muted">
          <Building2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
          {search ? "No tenants match your search" : "No tenants found"}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-ds-border bg-ds-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ds-border bg-ds-surface">
                <th className="text-left px-5 py-3 font-semibold text-ds-text min-w-[200px]">Tenant</th>
                {ALL_FLAGS.map((f) => (
                  <th key={f.key} className="text-center px-3 py-3 font-medium text-ds-muted min-w-[100px]">
                    <span className="block text-xs">{f.label}</span>
                    <span className="block text-[10px] text-ds-muted/70 font-normal">{f.plans.join(" / ")}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ds-border">
              {filtered.map((tenant) => (
                <tr key={tenant.tenantId} className="hover:bg-ds-surface transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-violet-900/40 flex items-center justify-center shrink-0">
                        <Building2 className="h-4 w-4 text-violet-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-ds-text truncate">{tenant.tenantName}</p>
                        <div className="flex items-center gap-2">
                          {tenant.subdomain && (
                            <p className="text-xs text-ds-muted truncate">{tenant.subdomain}</p>
                          )}
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${PLAN_COLOR[tenant.plan] ?? "bg-ds-surface text-ds-muted"}`}>
                            {tenant.plan}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  {ALL_FLAGS.map((f) => {
                    const enabled = tenant.flags[f.key] ?? false;
                    const key = `${tenant.tenantId}:${f.key}`;
                    const isSaving = saving === key;
                    return (
                      <td key={f.key} className="px-3 py-3.5 text-center">
                        <button
                          onClick={() => toggleFlag(tenant.tenantId, f.key, enabled)}
                          disabled={isSaving}
                          title={`${enabled ? "Disable" : "Enable"} ${f.label} for ${tenant.tenantName}`}
                          className="inline-flex items-center justify-center disabled:opacity-50 transition-colors"
                        >
                          {isSaving ? (
                            <Loader2 className="h-5 w-5 animate-spin text-ds-muted" />
                          ) : enabled ? (
                            <ToggleRight className="h-6 w-6 text-violet-400" />
                          ) : (
                            <ToggleLeft className="h-6 w-6 text-ds-muted/40" />
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="bg-amber-900/20 border border-amber-800 rounded-xl px-5 py-4 text-sm text-amber-400">
        <strong>Note:</strong> Feature flags override plan defaults. You can enable enterprise features
        for a Starter tenant (e.g., for trials) or restrict Pro features from a tenant for compliance reasons.
        Changes are instant — no restart required.
      </div>
    </div>
  );
}
