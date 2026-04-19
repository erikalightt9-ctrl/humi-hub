"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Package, AlertTriangle, FolderTree, ArrowUpRight, ArrowDownRight,
  Activity, Loader2, Plus, SlidersHorizontal,
} from "lucide-react";

type DashData = {
  totals: { categories: number; items: number; lowStock: number; outOfStock: number };
  lowStockItems: Array<{ id: string; name: string; unit: string; totalStock: number; minThreshold: number; category: { id: string; name: string; icon: string | null } }>;
  categories: Array<{ id: string; name: string; icon: string | null; itemCount: number; lowStock: number; outOfStock: number }>;
  recentActivity: Array<{ id: string; type: string; quantity: number; note: string | null; createdAt: string; item: { id: string; name: string; unit: string } }>;
};

export default function InventoryDashboardPage() {
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/inventory/dashboard");
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Failed");
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-sm text-red-600">
        {error ?? "No data"}
      </div>
    );
  }

  const { totals, lowStockItems, categories, recentActivity } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Inventory Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Overview of categories, stock levels, and recent activity
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/admin/admin/inventory/categories"
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm rounded-xl font-medium transition-colors shadow-sm border border-slate-200 dark:border-slate-700"
          >
            <FolderTree className="h-4 w-4" /> Manage Categories
          </Link>
          <Link
            href="/admin/admin/stockroom/bulk"
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl font-medium transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" /> Add Stocks
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Categories" value={totals.categories} icon={<FolderTree className="h-5 w-5 text-indigo-600" />} />
        <KpiCard label="Total Items" value={totals.items}     icon={<Package className="h-5 w-5 text-emerald-600" />} />
        <KpiCard label="Low Stock"   value={totals.lowStock}   icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}   warn={totals.lowStock > 0} />
        <KpiCard label="Out of Stock" value={totals.outOfStock} icon={<AlertTriangle className="h-5 w-5 text-red-600" />}    warn={totals.outOfStock > 0} />
      </div>

      {/* Categories grid */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Categories</h2>
        {categories.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center">
            <p className="text-sm text-slate-500 mb-3">No categories yet.</p>
            <Link
              href="/admin/admin/inventory/categories"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="h-4 w-4" /> Create category
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/admin/admin/inventory/categories/${c.id}`}
                className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 hover:shadow-md hover:border-indigo-300 transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{c.icon ?? "📋"}</span>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{c.name}</p>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{c.itemCount}</p>
                <div className="flex items-center gap-3 mt-1 text-[11px]">
                  {c.lowStock > 0 && <span className="text-amber-600 dark:text-amber-400">{c.lowStock} low</span>}
                  {c.outOfStock > 0 && <span className="text-red-600 dark:text-red-400">{c.outOfStock} out</span>}
                  {c.lowStock === 0 && c.outOfStock === 0 && <span className="text-emerald-600 dark:text-emerald-400">all good</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Two-column: Low stock + Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Low stock alerts
            </h2>
          </div>
          {lowStockItems.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No low-stock items.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {lowStockItems.map((it) => (
                <li key={it.id} className="py-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{it.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {it.category.icon} {it.category.name}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-amber-600 tabular-nums">{it.totalStock} {it.unit}</p>
                    <p className="text-[11px] text-slate-400">min {it.minThreshold}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mb-3">
            <Activity className="h-4 w-4 text-indigo-500" /> Recent stock activity
          </h2>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No recent activity.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentActivity.map((m) => {
                const sign = m.quantity >= 0 ? "+" : "";
                const isIn = m.type === "IN";
                const isOut = m.type === "OUT";
                const Icon = isIn ? ArrowDownRight : isOut ? ArrowUpRight : SlidersHorizontal;
                const color = isIn ? "text-emerald-600" : isOut ? "text-red-600" : "text-indigo-600";
                return (
                  <li key={m.id} className="py-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className={`h-4 w-4 ${color}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{m.item.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{m.note ?? m.type}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-semibold tabular-nums ${color}`}>
                        {sign}{m.quantity} {m.item.unit}
                      </p>
                      <p className="text-[11px] text-slate-400">{new Date(m.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon, warn }: { label: string; value: number; icon: React.ReactNode; warn?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 bg-white dark:bg-slate-900 ${warn ? "border-amber-200 dark:border-amber-800" : "border-slate-200 dark:border-slate-700"}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</p>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums mt-2">{value}</p>
    </div>
  );
}
