"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Plus,
  Search,
  UserCheck,
  ExternalLink,
  Eye,
  ChevronRight,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Tenant = {
  id: string;
  name: string;
  slug: string;
  subdomain: string | null;
  email: string;
  plan: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  _count: { students: number; courses: number; managers: number };
};

const PLAN_BADGE: Record<string, string> = {
  TRIAL:        "bg-amber-50 text-amber-700 border border-amber-200",
  STARTER:      "bg-blue-50 text-blue-700 border border-blue-200",
  PROFESSIONAL: "bg-blue-50 text-blue-700 border border-blue-200",
  ENTERPRISE:   "bg-emerald-50 text-emerald-700 border border-emerald-200",
};

function StatusDot({ tenant }: { tenant: Tenant }) {
  if (tenant.plan === "TRIAL") {
    return (
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-amber-400" />
        <span className="text-xs text-slate-600">Trial</span>
      </span>
    );
  }
  if (tenant.isActive) {
    return (
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        <span className="text-xs text-slate-600">Active</span>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full bg-red-500" />
      <span className="text-xs text-slate-600">Suspended</span>
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function TenantsPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Tenant | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const fetchTenants = useCallback(async () => {
    try {
      const res = await fetch("/api/superadmin/tenants");
      const json = await res.json();
      if (json.success) {
        setTenants(json.data ?? []);
      }
    } catch {
      // silently fail — table stays empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const handleToggleSuspend = async (tenant: Tenant) => {
    setActionLoading(tenant.id + "-suspend");
    try {
      const res = await fetch(`/api/superadmin/tenants/${tenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !tenant.isActive }),
      });
      if (res.ok) {
        setTenants((prev) =>
          prev.map((t) =>
            t.id === tenant.id ? { ...t, isActive: !tenant.isActive } : t
          )
        );
        showToast(
          `${tenant.name} has been ${!tenant.isActive ? "activated" : "suspended"}.`
        );
      } else {
        showToast("Failed to update tenant status.");
      }
    } catch {
      showToast("Network error. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (tenant: Tenant) => {
    setActionLoading(tenant.id + "-delete");
    setConfirmDelete(null);
    try {
      const res = await fetch(`/api/superadmin/tenants/${tenant.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok) {
        setTenants((prev) => prev.filter((t) => t.id !== tenant.id));
        showToast(`"${tenant.name}" has been permanently deleted.`);
      } else {
        showToast(json.error ?? "Failed to delete tenant.");
      }
    } catch {
      showToast("Network error. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleImpersonate = (tenant: Tenant) => {
    showToast(`Full impersonation coming soon — managing tenant ${tenant.name}`);
    window.open(`/superadmin/tenants/${tenant.id}`, "_blank");
  };

  const filtered = tenants.filter(
    (t) =>
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.subdomain ?? "").toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {/* Delete Confirm Dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Delete Tenant</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-slate-700 mb-5">
              Are you sure you want to permanently delete{" "}
              <span className="font-semibold text-red-600">{confirmDelete.name}</span>?
              All associated data including users, courses, and records will be removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">Tenants</h1>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
            {tenants.length}
          </span>
        </div>
        <Button asChild size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
          <Link href="/superadmin/tenants/new">
            <Plus className="h-4 w-4" />
            New Tenant
          </Link>
        </Button>
      </div>

      {/* ── Quick Tenant View ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Eye className="h-4 w-4 text-indigo-500" />
          <span className="text-sm font-semibold text-slate-700">Quick Tenant View</span>
          <span className="text-xs text-slate-400 ml-1">— jump directly into any tenant workspace</span>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedTenantId}
            onChange={(e) => setSelectedTenantId(e.target.value)}
            className="flex-1 text-sm rounded-lg border border-slate-200 bg-slate-50 px-3 py-2
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
              text-slate-700 cursor-pointer"
          >
            <option value="" disabled>Select a tenant to view…</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} {t.subdomain ? `(${t.subdomain})` : ""}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            disabled={!selectedTenantId}
            onClick={() => selectedTenantId && router.push(`/superadmin/view/${selectedTenantId}/dashboard`)}
            className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40"
          >
            View
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        {/* Quick-access pills for loaded tenants */}
        {tenants.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {tenants.slice(0, 6).map((t) => (
              <Link
                key={t.id}
                href={`/superadmin/view/${t.id}/dashboard`}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full
                  bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700
                  border border-slate-200 hover:border-indigo-200 transition-colors"
              >
                <Building2 className="h-3 w-3" />
                {t.name}
              </Link>
            ))}
            {tenants.length > 6 && (
              <span className="inline-flex items-center text-xs px-2.5 py-1 text-slate-400">
                +{tenants.length - 6} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name or subdomain..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">
                Tenant
              </th>
              <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">
                Plan
              </th>
              <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">
                Status
              </th>
              <th className="text-right px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">
                Students
              </th>
              <th className="text-right px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">
                Courses
              </th>
              <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">
                Created
              </th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-400">
                  Loading tenants...
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-400">
                  <Building2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  {search ? "No tenants match your search." : "No tenants yet."}
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-slate-300 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-slate-900">{tenant.name}</p>
                        <p className="text-xs text-slate-400 font-mono">
                          {tenant.subdomain ?? tenant.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        PLAN_BADGE[tenant.plan] ?? "bg-slate-50 text-slate-500"
                      }`}
                    >
                      {tenant.plan}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <StatusDot tenant={tenant} />
                  </td>
                  <td className="px-5 py-3 text-right text-slate-700">
                    {tenant._count.students}
                  </td>
                  <td className="px-5 py-3 text-right text-slate-700">
                    {tenant._count.courses}
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500">
                    {formatDate(tenant.createdAt)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      {/* Manage */}
                      <Link
                        href={`/superadmin/tenants/${tenant.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        Manage
                      </Link>

                      {/* Impersonate */}
                      <button
                        onClick={() => handleImpersonate(tenant)}
                        className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors"
                      >
                        <UserCheck className="h-3 w-3" />
                        <ExternalLink className="h-3 w-3" />
                      </button>

                      {/* Suspend / Activate */}
                      <button
                        disabled={actionLoading === tenant.id + "-suspend"}
                        onClick={() => handleToggleSuspend(tenant)}
                        className={`inline-flex items-center text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                          tenant.isActive
                            ? "border-red-200 text-red-600 hover:bg-red-50"
                            : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        }`}
                      >
                        {actionLoading === tenant.id + "-suspend"
                          ? "..."
                          : tenant.isActive
                          ? "Suspend"
                          : "Activate"}
                      </button>

                      {/* Delete */}
                      {!tenant.isDefault && (
                        <button
                          disabled={actionLoading === tenant.id + "-delete"}
                          onClick={() => setConfirmDelete(tenant)}
                          className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                          title="Delete tenant"
                        >
                          {actionLoading === tenant.id + "-delete"
                            ? "..."
                            : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
