"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Monitor, Package, UserCheck, Wrench, Archive,
  Inbox, ArrowRight, Loader2, RefreshCw,
} from "lucide-react";

interface AssetStats {
  total: number; available: number; assigned: number;
  inRepair: number; forDisposal: number; retired: number;
}

interface Category { id: string; name: string; _count?: { assets: number } }

interface ItRequest {
  id: string; referenceNo: string; subject: string;
  requestType: string; priority: string; status: string; createdAt: string;
  submittedBy: { firstName: string; lastName: string } | null;
}

const PRIORITY_COLOR: Record<string, string> = {
  LOW:    "bg-slate-100 text-slate-500",
  MEDIUM: "bg-blue-100 text-blue-600",
  HIGH:   "bg-amber-100 text-amber-700",
  URGENT: "bg-red-100 text-red-700",
};

const TYPE_LABEL: Record<string, string> = {
  SUPPORT: "Support", ACCESS_REQUEST: "Access", HARDWARE_ISSUE: "Hardware",
  SOFTWARE_ISSUE: "Software", NEW_EQUIPMENT: "New Equipment", OTHER: "Other",
};

function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function ITHubPage() {
  const [stats, setStats]               = useState<AssetStats | null>(null);
  const [categories, setCategories]     = useState<Category[]>([]);
  const [requests, setRequests]         = useState<ItRequest[]>([]);
  const [openCount, setOpenCount]       = useState(0);
  const [loading, setLoading]           = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, cRes, rRes] = await Promise.all([
        fetch("/api/admin/it/assets?stats=1"),
        fetch("/api/admin/it/categories"),
        fetch("/api/admin/it/requests"),
      ]);
      const [sJson, cJson, rJson] = await Promise.all([
        sRes.json() as Promise<{ success: boolean; data: AssetStats }>,
        cRes.json() as Promise<{ success: boolean; data: Category[] }>,
        rRes.json() as Promise<{ success: boolean; data: { requests: ItRequest[]; counts: { status: string; _count: { _all: number } }[] } }>,
      ]);

      if (sJson.success) setStats(sJson.data);
      if (cJson.success) setCategories(cJson.data);
      if (rJson.success) {
        setRequests(rJson.data.requests.slice(0, 5));
        setOpenCount(rJson.data.counts.find((c) => c.status === "OPEN")?._count._all ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const kpis = stats
    ? [
        { label: "Total Assets",       value: stats.total,                          icon: Monitor,   accent: "bg-slate-700"    },
        { label: "Assigned",           value: stats.assigned,                       icon: UserCheck, accent: "bg-blue-600"     },
        { label: "Available",          value: stats.available,                      icon: Package,   accent: "bg-emerald-600"  },
        { label: "In Repair",          value: stats.inRepair,                       icon: Wrench,    accent: "bg-amber-500"    },
        { label: "Open Requests",      value: openCount,                            icon: Inbox,     accent: "bg-rose-600"     },
        { label: "Retired / Disposed", value: stats.retired + stats.forDisposal,    icon: Archive,   accent: "bg-slate-400"    },
      ]
    : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">IT & Systems</h1>
          <p className="text-slate-500 text-sm mt-1">
            Asset tracking, assignments, and IT support requests
          </p>
        </div>
        <button
          onClick={() => void load()} disabled={loading}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 border border-slate-200 rounded-xl px-3 py-2 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {loading && !stats && (
        <div className="flex items-center justify-center py-24 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}

      {stats && (
        <>
          {/* KPI tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {kpis.map((k) => (
              <div key={k.label} className="bg-white border rounded-2xl p-5 flex flex-col gap-3">
                <div className={`h-10 w-10 rounded-xl ${k.accent} flex items-center justify-center`}>
                  <k.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-0.5">{k.label}</p>
                  <p className="text-2xl font-extrabold text-slate-900">{k.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Categories */}
            <div className="bg-white border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Asset Categories</h2>
                <Link href="/admin/it/assets" className="text-xs text-blue-600 hover:underline font-medium">
                  All assets →
                </Link>
              </div>
              {categories.length === 0 ? (
                <p className="text-sm text-slate-400">No categories yet. Add assets to get started.</p>
              ) : (
                <div className="space-y-1">
                  {categories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <span className="text-sm font-medium text-slate-700">{cat.name}</span>
                      {cat._count && (
                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          {cat._count.assets}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Module quick links + recent requests */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "All Assets",  desc: "Inventory & who has what", href: "/admin/it/assets",   accent: "bg-slate-700" },
                  { label: "IT Requests", desc: "Support & access tickets",  href: "/admin/it/requests", accent: "bg-rose-600"  },
                ].map((l) => (
                  <Link key={l.href} href={l.href}
                    className="bg-white border rounded-2xl p-5 hover:shadow-md transition-shadow flex flex-col gap-2"
                  >
                    <div className={`h-9 w-9 rounded-xl ${l.accent} flex items-center justify-center`}>
                      <ArrowRight className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">{l.label}</p>
                    <p className="text-xs text-slate-400">{l.desc}</p>
                  </Link>
                ))}
              </div>

              <div className="bg-white border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Recent Requests</h2>
                  <Link href="/admin/it/requests" className="text-xs text-blue-600 hover:underline font-medium">View all →</Link>
                </div>
                {requests.length === 0 ? (
                  <p className="text-sm text-slate-400">No requests yet.</p>
                ) : (
                  <div className="space-y-3">
                    {requests.map((r) => (
                      <div key={r.id} className="flex items-start gap-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${PRIORITY_COLOR[r.priority] ?? "bg-slate-100 text-slate-500"}`}>
                          {r.priority}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{r.subject}</p>
                          <p className="text-xs text-slate-400">
                            {TYPE_LABEL[r.requestType] ?? r.requestType}
                            {r.submittedBy && ` · ${r.submittedBy.firstName} ${r.submittedBy.lastName}`}
                          </p>
                        </div>
                        <span className="text-xs text-slate-400 shrink-0">{timeAgo(r.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
