"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, AlertCircle, Plus, FileText, PhoneCall, AtSign, Calendar } from "lucide-react";

interface ActivityItem {
  id: string;
  activityType: string;
  subject: string;
  body: string | null;
  createdAt: string;
  deal: { id: string; title: string } | null;
  contact: { id: string; firstName: string; lastName: string } | null;
}

interface Contact { id: string; firstName: string; lastName: string }
interface Deal    { id: string; title: string }

const ACTIVITY_TYPES = ["NOTE", "CALL", "EMAIL", "MEETING"] as const;
type ActivityType = typeof ACTIVITY_TYPES[number];

const TYPE_ICON: Record<ActivityType, React.ReactNode> = {
  NOTE:    <FileText className="h-4 w-4" />,
  CALL:    <PhoneCall className="h-4 w-4" />,
  EMAIL:   <AtSign className="h-4 w-4" />,
  MEETING: <Calendar className="h-4 w-4" />,
};

const TYPE_STYLES: Record<ActivityType, string> = {
  NOTE:    "bg-slate-100 text-slate-600",
  CALL:    "bg-green-100 text-green-700",
  EMAIL:   "bg-blue-100 text-blue-700",
  MEETING: "bg-purple-100 text-purple-700",
};

const EMPTY_FORM = {
  activityType: "NOTE" as ActivityType,
  subject: "",
  body: "",
  dealId: "",
  contactId: "",
};

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState("");

  const [contacts, setContacts]     = useState<Contact[]>([]);
  const [deals, setDeals]           = useState<Deal[]>([]);

  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState({ ...EMPTY_FORM });
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set("activityType", typeFilter);
      params.set("limit", "50");
      const res  = await fetch(`/api/admin/sales/activities?${params}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setActivities(json.data.data);
      setTotal(json.data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load activities");
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  const loadLookups = useCallback(async () => {
    try {
      const [cr, dr] = await Promise.all([
        fetch("/api/admin/sales/contacts?limit=200"),
        fetch("/api/admin/sales/pipeline"),
      ]);
      const cj = await cr.json();
      const dj = await dr.json();
      if (cj.success) setContacts(cj.data.data ?? []);
      if (dj.success) setDeals(dj.data ?? []);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadLookups(); }, [loadLookups]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const body = {
        activityType: form.activityType,
        subject:      form.subject,
        body:         form.body || null,
        dealId:       form.dealId || null,
        contactId:    form.contactId || null,
      };
      const res  = await fetch("/api/admin/sales/activities", {
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Activity Feed</h1>
          <p className="text-sm text-slate-500 mt-1">{total} activities</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" /> Log Activity
        </button>
      </div>

      {/* Log Activity form */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Log Activity</h2>
          {formError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" /><span>{formError}</span>
            </div>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Type *</label>
              <select
                value={form.activityType}
                onChange={(e) => setForm({ ...form, activityType: e.target.value as ActivityType })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {ACTIVITY_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Subject *</label>
              <input
                required
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Linked Deal</label>
              <select
                value={form.dealId}
                onChange={(e) => setForm({ ...form, dealId: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">— None —</option>
                {deals.map((d) => (
                  <option key={d.id} value={d.id}>{d.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Linked Contact</label>
              <select
                value={form.contactId}
                onChange={(e) => setForm({ ...form, contactId: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">— None —</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
              <textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                rows={3}
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
                Save Activity
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Types</option>
          {ACTIVITY_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0" /><span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : activities.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center">
          <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No activities yet</p>
          <p className="text-sm text-slate-400 mt-1">Log your first activity to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((act) => {
            const type = act.activityType as ActivityType;
            return (
              <div key={act.id} className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${TYPE_STYLES[type] ?? "bg-slate-100 text-slate-600"}`}>
                    {TYPE_ICON[type]}
                    {type}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{act.subject}</p>
                    {act.body && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{act.body}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {act.deal && (
                        <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                          Deal: {act.deal.title}
                        </span>
                      )}
                      {act.contact && (
                        <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                          {act.contact.firstName} {act.contact.lastName}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">
                    {new Date(act.createdAt).toLocaleDateString("en-PH")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
