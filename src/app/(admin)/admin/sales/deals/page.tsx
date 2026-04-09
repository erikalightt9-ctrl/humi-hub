"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Loader2, AlertCircle, Plus, TrendingUp } from "lucide-react";

interface Deal {
  id: string;
  title: string;
  stage: string;
  value: number;
  expectedCloseDate: string | null;
  contact: { id: string; firstName: string; lastName: string } | null;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
}

const STAGES = ["NEW_LEAD", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"] as const;
type Stage = typeof STAGES[number];

const STAGE_LABELS: Record<Stage, string> = {
  NEW_LEAD:    "New Lead",
  QUALIFIED:   "Qualified",
  PROPOSAL:    "Proposal",
  NEGOTIATION: "Negotiation",
  WON:         "Won",
  LOST:        "Lost",
};

const STAGE_COLORS: Record<Stage, string> = {
  NEW_LEAD:    "bg-slate-100 border-slate-300 text-slate-700",
  QUALIFIED:   "bg-blue-50 border-blue-200 text-blue-700",
  PROPOSAL:    "bg-indigo-50 border-indigo-200 text-indigo-700",
  NEGOTIATION: "bg-amber-50 border-amber-200 text-amber-700",
  WON:         "bg-green-50 border-green-200 text-green-700",
  LOST:        "bg-red-50 border-red-200 text-red-600",
};

const STAGE_HEADER: Record<Stage, string> = {
  NEW_LEAD:    "bg-slate-200 text-slate-700",
  QUALIFIED:   "bg-blue-100 text-blue-800",
  PROPOSAL:    "bg-indigo-100 text-indigo-800",
  NEGOTIATION: "bg-amber-100 text-amber-800",
  WON:         "bg-green-100 text-green-800",
  LOST:        "bg-red-100 text-red-700",
};

const fmt = (n: number) =>
  `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

const EMPTY_FORM = {
  title: "", value: "", contactId: "", stage: "NEW_LEAD" as Stage, expectedCloseDate: "",
};

export default function PipelinePage() {
  const [deals, setDeals]         = useState<Deal[]>([]);
  const [contacts, setContacts]   = useState<Contact[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState({ ...EMPTY_FORM });
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [movingId, setMovingId]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dealsRes, contactsRes] = await Promise.all([
        fetch("/api/admin/sales/pipeline"),
        fetch("/api/admin/sales/contacts?limit=200"),
      ]);
      const dealsJson    = await dealsRes.json();
      const contactsJson = await contactsRes.json();
      if (!dealsJson.success) throw new Error(dealsJson.error);
      setDeals(dealsJson.data);
      if (contactsJson.success) setContacts(contactsJson.data.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load pipeline");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const body = {
        title: form.title,
        value: parseFloat(form.value) || 0,
        contactId: form.contactId || null,
        stage: form.stage,
        expectedCloseDate: form.expectedCloseDate || null,
      };
      const res  = await fetch("/api/admin/sales/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setShowForm(false);
      setForm({ ...EMPTY_FORM });
      load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const moveStage = async (dealId: string, newStage: Stage) => {
    setMovingId(dealId);
    try {
      const res  = await fetch(`/api/admin/sales/deals/${dealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to move stage");
    } finally {
      setMovingId(null);
    }
  };

  const dealsByStage = (stage: Stage) => deals.filter((d) => d.stage === stage);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Sales Pipeline</h1>
          <p className="text-sm text-slate-500 mt-1">{deals.length} active deals</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" /> New Deal
        </button>
      </div>

      {/* New Deal form */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-semibold text-slate-800 mb-4">New Deal</h2>
          {formError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" /><span>{formError}</span>
            </div>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Title *</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Value (₱)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Contact</label>
              <select
                value={form.contactId}
                onChange={(e) => setForm({ ...form, contactId: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">— No contact —</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Stage</label>
              <select
                value={form.stage}
                onChange={(e) => setForm({ ...form, stage: e.target.value as Stage })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Expected Close Date</label>
              <input
                type="date"
                value={form.expectedCloseDate}
                onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="sm:col-span-2 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => { setShowForm(false); setForm({ ...EMPTY_FORM }); }}
                className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Create Deal
              </button>
            </div>
          </form>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0" /><span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        /* Kanban Board */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageDeals = dealsByStage(stage);
            return (
              <div key={stage} className="flex-shrink-0 w-64">
                <div className={`rounded-t-lg px-3 py-2 flex items-center justify-between ${STAGE_HEADER[stage]}`}>
                  <span className="text-xs font-semibold">{STAGE_LABELS[stage]}</span>
                  <span className="text-xs font-medium opacity-70">{stageDeals.length}</span>
                </div>
                <div className="bg-slate-100 rounded-b-lg p-2 space-y-2 min-h-32">
                  {stageDeals.length === 0 ? (
                    <div className="flex items-center justify-center h-20">
                      <p className="text-xs text-slate-400">No deals</p>
                    </div>
                  ) : (
                    stageDeals.map((deal) => (
                      <div
                        key={deal.id}
                        className={`border rounded-lg p-3 bg-white shadow-sm ${STAGE_COLORS[stage]}`}
                      >
                        <Link
                          href={`/admin/sales/deals/${deal.id}`}
                          className="block font-medium text-sm hover:text-indigo-700 mb-1"
                        >
                          {deal.title}
                        </Link>
                        {deal.contact && (
                          <p className="text-xs text-slate-500 mb-1">
                            {deal.contact.firstName} {deal.contact.lastName}
                          </p>
                        )}
                        <p className="text-xs font-semibold text-indigo-700">{fmt(Number(deal.value))}</p>
                        {deal.expectedCloseDate && (
                          <p className="text-xs text-slate-400 mt-1">
                            Close: {new Date(deal.expectedCloseDate).toLocaleDateString("en-PH")}
                          </p>
                        )}
                        <div className="mt-2 pt-2 border-t border-current border-opacity-20">
                          <label className="text-xs text-slate-400 mr-1">Move to:</label>
                          <select
                            value=""
                            onChange={(e) => {
                              if (e.target.value) moveStage(deal.id, e.target.value as Stage);
                            }}
                            disabled={movingId === deal.id}
                            className="text-xs border border-slate-200 rounded px-1 py-0.5 bg-white text-slate-600 focus:outline-none"
                          >
                            <option value="">—</option>
                            {STAGES.filter((s) => s !== stage).map((s) => (
                              <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                            ))}
                          </select>
                          {movingId === deal.id && (
                            <Loader2 className="inline h-3 w-3 animate-spin ml-1 text-slate-400" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && deals.length === 0 && (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center">
          <TrendingUp className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No deals yet</p>
          <p className="text-sm text-slate-400 mt-1">Create your first deal to start tracking your pipeline.</p>
        </div>
      )}
    </div>
  );
}
