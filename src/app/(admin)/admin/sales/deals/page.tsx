"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Loader2, AlertCircle, Plus, TrendingUp, ChevronRight } from "lucide-react";

interface Contact {
  id: string;
  name: string;
}

interface Deal {
  id: string;
  title: string;
  stage: string;
  value: number;
  expectedCloseDate: string | null;
  contact: { id: string; name: string } | null;
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
  NEW_LEAD:    "bg-white border-slate-200",
  QUALIFIED:   "bg-white border-blue-200",
  PROPOSAL:    "bg-white border-indigo-200",
  NEGOTIATION: "bg-white border-amber-200",
  WON:         "bg-white border-green-200",
  LOST:        "bg-white border-red-200",
};

const STAGE_HEADER: Record<Stage, string> = {
  NEW_LEAD:    "bg-slate-100 text-slate-700",
  QUALIFIED:   "bg-blue-100 text-blue-800",
  PROPOSAL:    "bg-indigo-100 text-indigo-800",
  NEGOTIATION: "bg-amber-100 text-amber-800",
  WON:         "bg-green-100 text-green-800",
  LOST:        "bg-red-100 text-red-700",
};

const STAGE_DOT: Record<Stage, string> = {
  NEW_LEAD:    "bg-slate-400",
  QUALIFIED:   "bg-blue-500",
  PROPOSAL:    "bg-indigo-500",
  NEGOTIATION: "bg-amber-500",
  WON:         "bg-green-500",
  LOST:        "bg-red-500",
};

/* Standard progression: each stage's natural next and prev */
const NEXT_STAGE: Partial<Record<Stage, Stage>> = {
  NEW_LEAD:    "QUALIFIED",
  QUALIFIED:   "PROPOSAL",
  PROPOSAL:    "NEGOTIATION",
  NEGOTIATION: "WON",
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
      const [pipelineRes, contactsRes] = await Promise.all([
        fetch("/api/admin/sales/pipeline"),
        fetch("/api/admin/sales/contacts?limit=200"),
      ]);
      const pipelineJson = await pipelineRes.json();
      const contactsJson = await contactsRes.json();
      if (!pipelineJson.success) throw new Error(pipelineJson.error);
      // API returns grouped Record<Stage, Deal[]> — flatten to a single array
      const grouped = pipelineJson.data as Record<string, Deal[]>;
      const flat = (Object.values(grouped) as Deal[][]).flat();
      setDeals(flat);
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

  const activeDeals = deals.filter((d) => d.stage !== "LOST" && d.stage !== "WON");
  const pipelineValue = activeDeals.reduce((sum, d) => sum + Number(d.value), 0);
  const wonDeals = deals.filter((d) => d.stage === "WON");
  const wonValue = wonDeals.reduce((sum, d) => sum + Number(d.value), 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Sales Pipeline</h1>
          <p className="text-sm text-slate-500 mt-1">
            {activeDeals.length} active deal{activeDeals.length !== 1 ? "s" : ""} · {fmt(pipelineValue)} in pipeline
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" /> New Deal
        </button>
      </div>

      {/* Stage flow summary */}
      <div className="flex items-center gap-1 flex-wrap">
        {(["NEW_LEAD", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON"] as Stage[]).map((stage, i, arr) => {
          const count = dealsByStage(stage).length;
          return (
            <div key={stage} className="flex items-center gap-1">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-700 shadow-sm">
                <span className={`w-2 h-2 rounded-full ${STAGE_DOT[stage]}`} />
                {STAGE_LABELS[stage]}
                <span className="ml-0.5 font-bold">{count}</span>
              </div>
              {i < arr.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-slate-300" />}
            </div>
          );
        })}
        <span className="text-xs text-slate-400 ml-2">· Won: {wonDeals.length} ({fmt(wonValue)})</span>
      </div>

      {/* New Deal form */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">New Deal</h2>
          {formError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" /><span>{formError}</span>
            </div>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Deal Title *</label>
              <input
                required
                placeholder="e.g. ABC Corp — Software License"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Deal Value (₱)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
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
                  <option key={c.id} value={c.id}>{c.name}</option>
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
            const stageTotal = stageDeals.reduce((s, d) => s + Number(d.value), 0);
            const nextStage = NEXT_STAGE[stage];
            return (
              <div key={stage} className="flex-shrink-0 w-64">
                <div className={`rounded-t-lg px-3 py-2 ${STAGE_HEADER[stage]}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">{STAGE_LABELS[stage]}</span>
                    <span className="text-xs font-medium opacity-70">{stageDeals.length}</span>
                  </div>
                  {stageDeals.length > 0 && (
                    <p className="text-xs opacity-60 mt-0.5">{fmt(stageTotal)}</p>
                  )}
                </div>
                <div className="bg-slate-50 border border-t-0 border-slate-200 rounded-b-lg p-2 space-y-2 min-h-32">
                  {stageDeals.length === 0 ? (
                    <div className="flex items-center justify-center h-20">
                      <p className="text-xs text-slate-400">No deals</p>
                    </div>
                  ) : (
                    stageDeals.map((deal) => (
                      <div
                        key={deal.id}
                        className={`border rounded-lg p-3 shadow-sm ${STAGE_COLORS[stage]}`}
                      >
                        <Link
                          href={`/admin/sales/deals/${deal.id}`}
                          className="block font-medium text-sm text-slate-800 hover:text-indigo-700 mb-1 leading-snug"
                        >
                          {deal.title}
                        </Link>
                        {deal.contact && (
                          <p className="text-xs text-slate-500 mb-1">{deal.contact.name}</p>
                        )}
                        <p className="text-xs font-semibold text-indigo-700">{fmt(Number(deal.value))}</p>
                        {deal.expectedCloseDate && (
                          <p className="text-xs text-slate-400 mt-1">
                            Close: {new Date(deal.expectedCloseDate).toLocaleDateString("en-PH")}
                          </p>
                        )}
                        {/* Standard progression button + full move dropdown */}
                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
                          {nextStage && stage !== "WON" && stage !== "LOST" && (
                            <button
                              onClick={() => moveStage(deal.id, nextStage)}
                              disabled={movingId === deal.id}
                              className="text-xs px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded hover:bg-indigo-100 disabled:opacity-50"
                            >
                              → {STAGE_LABELS[nextStage]}
                            </button>
                          )}
                          {stage !== "WON" && stage !== "LOST" && (
                            <>
                              <button
                                onClick={() => moveStage(deal.id, "WON")}
                                disabled={movingId === deal.id}
                                className="text-xs px-2 py-0.5 bg-green-50 border border-green-200 text-green-700 rounded hover:bg-green-100 disabled:opacity-50"
                              >
                                Won
                              </button>
                              <button
                                onClick={() => moveStage(deal.id, "LOST")}
                                disabled={movingId === deal.id}
                                className="text-xs px-2 py-0.5 bg-red-50 border border-red-200 text-red-600 rounded hover:bg-red-100 disabled:opacity-50"
                              >
                                Lost
                              </button>
                            </>
                          )}
                          {(stage === "WON" || stage === "LOST") && (
                            <button
                              onClick={() => moveStage(deal.id, "NEW_LEAD")}
                              disabled={movingId === deal.id}
                              className="text-xs px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded hover:bg-slate-200 disabled:opacity-50"
                            >
                              Reopen
                            </button>
                          )}
                          {movingId === deal.id && (
                            <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
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

      {!loading && deals.length === 0 && !error && (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center">
          <TrendingUp className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No deals yet</p>
          <p className="text-sm text-slate-400 mt-1">Create your first deal to start tracking your pipeline.</p>
        </div>
      )}
    </div>
  );
}
