"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, AlertCircle, Users, TrendingUp, DollarSign, Trophy } from "lucide-react";

interface DashboardData {
  kpis: {
    totalContacts: number;
    totalDeals: number;
    pipelineValue: number;
    wonThisMonth: number;
  };
  funnel: Array<{
    stage: string;
    count: number;
    totalValue: number;
  }>;
  recentActivities: Array<{
    id: string;
    activityType: string;
    subject: string;
    createdAt: string;
    deal: { title: string } | null;
    contact: { firstName: string; lastName: string } | null;
  }>;
  overdueTasks: Array<{
    id: string;
    title: string;
    dueDate: string;
    deal: { title: string } | null;
  }>;
}

const fmt = (n: number) =>
  `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

const STAGE_LABELS: Record<string, string> = {
  NEW_LEAD:    "New Lead",
  QUALIFIED:   "Qualified",
  PROPOSAL:    "Proposal",
  NEGOTIATION: "Negotiation",
  WON:         "Won",
  LOST:        "Lost",
};

const ACTIVITY_BADGE: Record<string, string> = {
  NOTE:    "bg-slate-100 text-slate-600",
  CALL:    "bg-green-100 text-green-700",
  EMAIL:   "bg-blue-100 text-blue-700",
  MEETING: "bg-purple-100 text-purple-700",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function SalesDashboardPage() {
  const [data, setData]       = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/admin/sales/dashboard");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setData(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0" /><span>{error}</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { kpis, funnel, recentActivities, overdueTasks } = data;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Sales Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Overview of your sales pipeline</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Users className="h-4 w-4 text-indigo-600" />
            </div>
            <span className="text-sm text-slate-500">Total Contacts</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{kpis.totalContacts}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
            <span className="text-sm text-slate-500">Total Deals</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{kpis.totalDeals}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-50 rounded-lg">
              <DollarSign className="h-4 w-4 text-amber-600" />
            </div>
            <span className="text-sm text-slate-500">Pipeline Value</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{fmt(kpis.pipelineValue)}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <Trophy className="h-4 w-4 text-green-600" />
            </div>
            <span className="text-sm text-slate-500">Won This Month</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{fmt(kpis.wonThisMonth)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deal Funnel */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Deal Funnel</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                <th className="pb-2 font-medium">Stage</th>
                <th className="pb-2 font-medium text-right">Count</th>
                <th className="pb-2 font-medium text-right">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {funnel.map((row) => (
                <tr key={row.stage}>
                  <td className="py-2 text-slate-700">{STAGE_LABELS[row.stage] ?? row.stage}</td>
                  <td className="py-2 text-right font-medium text-slate-800">{row.count}</td>
                  <td className="py-2 text-right text-indigo-700 font-medium">{fmt(row.totalValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent Activities */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Recent Activities</h2>
          {recentActivities.length === 0 ? (
            <p className="text-sm text-slate-400">No recent activities.</p>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((act) => (
                <div key={act.id} className="flex items-start gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${ACTIVITY_BADGE[act.activityType] ?? "bg-slate-100 text-slate-600"}`}>
                    {act.activityType}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">{act.subject}</p>
                    <p className="text-xs text-slate-400">
                      {act.deal
                        ? act.deal.title
                        : act.contact
                          ? `${act.contact.firstName} ${act.contact.lastName}`
                          : "—"}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">{timeAgo(act.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Overdue Tasks */}
      {overdueTasks.length > 0 && (
        <div className="bg-white border border-red-200 rounded-xl p-5">
          <h2 className="font-semibold text-red-700 mb-4">Overdue Tasks</h2>
          <div className="space-y-2">
            {overdueTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">{task.title}</p>
                  {task.deal && (
                    <p className="text-xs text-slate-500">{task.deal.title}</p>
                  )}
                </div>
                <span className="text-xs text-red-600 font-medium">
                  Due: {new Date(task.dueDate).toLocaleDateString("en-PH")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
