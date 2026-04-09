"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Loader2, AlertCircle, ArrowLeft, Edit2, Check, X,
  Phone, Mail, Building2, Briefcase, FileText,
  MessageSquare, PhoneCall, AtSign, Calendar,
} from "lucide-react";

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  position: string | null;
  contactType: string;
  notes: string | null;
  deals: Array<{
    id: string;
    title: string;
    stage: string;
    value: number;
    expectedCloseDate: string | null;
  }>;
  activities: Array<{
    id: string;
    activityType: string;
    subject: string;
    body: string | null;
    createdAt: string;
  }>;
}

const STAGE_STYLES: Record<string, string> = {
  NEW_LEAD:    "bg-slate-100 text-slate-600",
  QUALIFIED:   "bg-blue-100 text-blue-700",
  PROPOSAL:    "bg-indigo-100 text-indigo-700",
  NEGOTIATION: "bg-amber-100 text-amber-700",
  WON:         "bg-green-100 text-green-700",
  LOST:        "bg-red-100 text-red-600",
};

const ACTIVITY_ICON: Record<string, React.ReactNode> = {
  NOTE:    <FileText className="h-4 w-4 text-slate-500" />,
  CALL:    <PhoneCall className="h-4 w-4 text-green-600" />,
  EMAIL:   <AtSign className="h-4 w-4 text-blue-600" />,
  MEETING: <Calendar className="h-4 w-4 text-purple-600" />,
};

const ACTIVITY_TYPES = ["NOTE", "CALL", "EMAIL", "MEETING"];

const fmt = (n: number) =>
  `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

type EditableField = "firstName" | "lastName" | "email" | "phone" | "company" | "notes";

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [contact, setContact]     = useState<Contact | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const [editing, setEditing]     = useState<EditableField | null>(null);
  const [editVal, setEditVal]     = useState("");
  const [savingField, setSavingField] = useState(false);

  const [actForm, setActForm]     = useState({ activityType: "NOTE", subject: "", body: "" });
  const [savingAct, setSavingAct] = useState(false);
  const [actError, setActError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`/api/admin/sales/contacts/${id}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setContact(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load contact");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const startEdit = (field: EditableField, current: string | null) => {
    setEditing(field);
    setEditVal(current ?? "");
  };

  const saveField = async () => {
    if (!contact || !editing) return;
    setSavingField(true);
    try {
      const res  = await fetch(`/api/admin/sales/contacts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [editing]: editVal || null }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setContact({ ...contact, [editing]: editVal || null });
      setEditing(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSavingField(false);
    }
  };

  const submitActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAct(true);
    setActError(null);
    try {
      const res  = await fetch("/api/admin/sales/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...actForm, contactId: id }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setActForm({ activityType: "NOTE", subject: "", body: "" });
      load();
    } catch (e) {
      setActError(e instanceof Error ? e.message : "Failed to save activity");
    } finally {
      setSavingAct(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error ?? "Contact not found"}</span>
        </div>
      </div>
    );
  }

  const EDITABLE_FIELDS: Array<{ field: EditableField; label: string; icon: React.ReactNode }> = [
    { field: "firstName", label: "First Name",  icon: <Edit2 className="h-4 w-4" /> },
    { field: "lastName",  label: "Last Name",   icon: <Edit2 className="h-4 w-4" /> },
    { field: "email",     label: "Email",        icon: <Mail className="h-4 w-4" /> },
    { field: "phone",     label: "Phone",        icon: <Phone className="h-4 w-4" /> },
    { field: "company",   label: "Company",      icon: <Building2 className="h-4 w-4" /> },
    { field: "notes",     label: "Notes",        icon: <MessageSquare className="h-4 w-4" /> },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/sales/contacts"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Contacts
        </Link>
      </div>

      {/* Contact Info Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {contact.firstName} {contact.lastName}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {contact.position && (
                <span className="flex items-center gap-1 text-sm text-slate-500">
                  <Briefcase className="h-3.5 w-3.5" /> {contact.position}
                </span>
              )}
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                {contact.contactType}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {EDITABLE_FIELDS.map(({ field, label, icon }) => (
            <div key={field} className={field === "notes" ? "sm:col-span-2" : ""}>
              <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
              {editing === field ? (
                <div className="flex items-center gap-2">
                  {field === "notes" ? (
                    <textarea
                      value={editVal}
                      onChange={(e) => setEditVal(e.target.value)}
                      rows={3}
                      className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  ) : (
                    <input
                      value={editVal}
                      onChange={(e) => setEditVal(e.target.value)}
                      className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  )}
                  <button
                    onClick={saveField}
                    disabled={savingField}
                    className="p-1.5 text-green-600 hover:text-green-800 disabled:opacity-50"
                  >
                    {savingField ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => setEditing(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <span className="text-sm text-slate-700">
                    {contact[field] ?? <span className="text-slate-400 italic">Not set</span>}
                  </span>
                  <button
                    onClick={() => startEdit(field, contact[field])}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-600 transition-opacity"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Linked Deals */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="font-semibold text-slate-800 mb-4">Linked Deals</h2>
        {contact.deals.length === 0 ? (
          <p className="text-sm text-slate-400">No deals linked to this contact.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                <th className="pb-2 font-medium">Title</th>
                <th className="pb-2 font-medium">Stage</th>
                <th className="pb-2 font-medium text-right">Value</th>
                <th className="pb-2 font-medium text-right">Close Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {contact.deals.map((deal) => (
                <tr key={deal.id}>
                  <td className="py-2">
                    <Link href={`/admin/sales/deals/${deal.id}`} className="text-indigo-600 hover:text-indigo-800 font-medium">
                      {deal.title}
                    </Link>
                  </td>
                  <td className="py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STAGE_STYLES[deal.stage] ?? "bg-slate-100 text-slate-600"}`}>
                      {deal.stage}
                    </span>
                  </td>
                  <td className="py-2 text-right text-indigo-700 font-medium">{fmt(Number(deal.value))}</td>
                  <td className="py-2 text-right text-slate-500">
                    {deal.expectedCloseDate
                      ? new Date(deal.expectedCloseDate).toLocaleDateString("en-PH")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Activity Timeline */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="font-semibold text-slate-800 mb-4">Activity Timeline</h2>
        {contact.activities.length === 0 ? (
          <p className="text-sm text-slate-400">No activities yet.</p>
        ) : (
          <div className="space-y-3">
            {contact.activities.map((act) => (
              <div key={act.id} className="flex items-start gap-3">
                <div className="mt-0.5">{ACTIVITY_ICON[act.activityType] ?? <FileText className="h-4 w-4 text-slate-400" />}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{act.subject}</p>
                  {act.body && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{act.body}</p>}
                </div>
                <span className="text-xs text-slate-400 shrink-0">
                  {new Date(act.createdAt).toLocaleDateString("en-PH")}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Add Activity Form */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Log Activity</h3>
          {actError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-3 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" /><span>{actError}</span>
            </div>
          )}
          <form onSubmit={submitActivity} className="space-y-3">
            <div className="flex gap-3">
              <select
                value={actForm.activityType}
                onChange={(e) => setActForm({ ...actForm, activityType: e.target.value })}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {ACTIVITY_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <input
                required
                placeholder="Subject *"
                value={actForm.subject}
                onChange={(e) => setActForm({ ...actForm, subject: e.target.value })}
                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <textarea
              placeholder="Notes / details..."
              value={actForm.body}
              onChange={(e) => setActForm({ ...actForm, body: e.target.value })}
              rows={2}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingAct}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {savingAct && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Log Activity
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
