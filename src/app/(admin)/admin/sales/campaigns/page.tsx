"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus, Loader2, Tag, Calendar, DollarSign, Mail,
  MessageSquare, Share2, Users, FileText, MoreHorizontal, X,
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  budget: number | null;
  spent: number | null;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
  channel: string | null;
  createdAt: string;
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  EMAIL:        { label: "Email",        icon: <Mail className="h-3.5 w-3.5" />,         color: "bg-blue-100 text-blue-700"    },
  SMS:          { label: "SMS",          icon: <MessageSquare className="h-3.5 w-3.5" />, color: "bg-green-100 text-green-700"  },
  SOCIAL_MEDIA: { label: "Social Media", icon: <Share2 className="h-3.5 w-3.5" />,        color: "bg-pink-100 text-pink-700"    },
  EVENT:        { label: "Event",        icon: <Users className="h-3.5 w-3.5" />,         color: "bg-purple-100 text-purple-700"},
  CONTENT:      { label: "Content",      icon: <FileText className="h-3.5 w-3.5" />,      color: "bg-amber-100 text-amber-700"  },
  OTHER:        { label: "Other",        icon: <Tag className="h-3.5 w-3.5" />,           color: "bg-slate-100 text-slate-600"  },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFT:     { label: "Draft",     color: "bg-slate-100 text-slate-500"   },
  SCHEDULED: { label: "Scheduled", color: "bg-blue-100 text-blue-600"     },
  ACTIVE:    { label: "Active",    color: "bg-emerald-100 text-emerald-700"},
  PAUSED:    { label: "Paused",    color: "bg-amber-100 text-amber-700"   },
  COMPLETED: { label: "Completed", color: "bg-violet-100 text-violet-700" },
  CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-600"       },
};

const fmt = (n: number) =>
  `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 0 })}`;

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

/* ------------------------------------------------------------------ */
/*  Create modal                                                        */
/* ------------------------------------------------------------------ */
function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: "", type: "EMAIL", status: "DRAFT",
    budget: "", channel: "", startDate: "", endDate: "", description: "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/admin/sales/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        budget: form.budget ? parseFloat(form.budget) : null,
      }),
    });
    setSaving(false);
    onCreated();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">New Campaign</h2>
          <button onClick={onClose}><X className="h-4 w-4 text-slate-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Campaign Name *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Q3 Email Blast"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Budget (₱)</label>
              <input
                type="number" min="0" step="0.01"
                value={form.budget}
                onChange={(e) => setForm((p) => ({ ...p, budget: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Channel / Platform</label>
              <input
                value={form.channel}
                onChange={(e) => setForm((p) => ({ ...p, channel: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Facebook, Gmail"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Campaign goals, target audience, notes…"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button" onClick={onClose}
              className="flex-1 border border-slate-200 text-slate-600 rounded-xl py-2 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={saving}
              className="flex-1 bg-blue-600 text-white rounded-xl py-2 text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving…" : "Create Campaign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */
export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState("ALL");
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch("/api/admin/sales/campaigns");
    const json = await res.json() as { success: boolean; data: Campaign[] };
    if (json.success) setCampaigns(json.data);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = filter === "ALL"
    ? campaigns
    : campaigns.filter((c) => c.status === filter);

  const summary = {
    total:   campaigns.length,
    active:  campaigns.filter((c) => c.status === "ACTIVE").length,
    budget:  campaigns.reduce((s, c) => s + (c.budget ?? 0), 0),
    spent:   campaigns.reduce((s, c) => s + (c.spent ?? 0), 0),
  };

  return (
    <div className="space-y-6">
      {showCreate && (
        <CreateModal onClose={() => setShowCreate(false)} onCreated={load} />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Campaigns</h1>
          <p className="text-slate-500 text-sm mt-1">
            Track and manage marketing campaigns across all channels
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-blue-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Campaign
        </button>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Campaigns", value: summary.total,                    icon: <Tag className="h-4 w-4 text-blue-600" />,      bg: "bg-blue-50"    },
          { label: "Active",          value: summary.active,                   icon: <MoreHorizontal className="h-4 w-4 text-emerald-600" />, bg: "bg-emerald-50" },
          { label: "Total Budget",    value: fmt(summary.budget),              icon: <DollarSign className="h-4 w-4 text-violet-600" />, bg: "bg-violet-50" },
          { label: "Total Spent",     value: fmt(summary.spent),               icon: <DollarSign className="h-4 w-4 text-amber-600" />,   bg: "bg-amber-50"  },
        ].map((t) => (
          <div key={t.label} className="bg-white border border-slate-200 rounded-xl p-5">
            <div className={`w-9 h-9 rounded-lg ${t.bg} flex items-center justify-center mb-3`}>
              {t.icon}
            </div>
            <p className="text-xs text-slate-500 font-medium">{t.label}</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">{t.value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {["ALL", ...Object.keys(STATUS_CONFIG)].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
              filter === s
                ? "bg-slate-900 text-white"
                : "bg-white border border-slate-200 text-slate-500 hover:border-slate-400"
            }`}
          >
            {s === "ALL" ? "All" : STATUS_CONFIG[s].label}
          </button>
        ))}
      </div>

      {/* Campaign list */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          No campaigns yet. Create your first one.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr className="text-left text-xs text-slate-500 font-semibold">
                <th className="px-5 py-3">Campaign</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Budget</th>
                <th className="px-4 py-3">Dates</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((c) => {
                const tc = TYPE_CONFIG[c.type] ?? TYPE_CONFIG.OTHER;
                const sc = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.DRAFT;
                return (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-800">{c.name}</p>
                      {c.channel && <p className="text-xs text-slate-400">{c.channel}</p>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${tc.color}`}>
                        {tc.icon}{tc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${sc.color}`}>
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 font-medium">
                      {c.budget ? fmt(c.budget) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 text-xs">
                      {c.startDate
                        ? `${fmtDate(c.startDate)}${c.endDate ? ` → ${fmtDate(c.endDate)}` : ""}`
                        : <span className="text-slate-300">No dates</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
