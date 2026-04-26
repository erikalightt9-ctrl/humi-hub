"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Monitor, Plus, Loader2, CheckCircle2, Clock,
  XCircle, Inbox, AlertCircle, ChevronDown,
} from "lucide-react";

interface ItRequest {
  id: string;
  referenceNo: string;
  subject: string;
  description: string;
  requestType: string;
  priority: string;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
}

const REQUEST_TYPES = [
  { value: "SUPPORT",        label: "General Support"  },
  { value: "HARDWARE_ISSUE", label: "Hardware Issue"   },
  { value: "SOFTWARE_ISSUE", label: "Software Issue"   },
  { value: "ACCESS_REQUEST", label: "Access Request"   },
  { value: "NEW_EQUIPMENT",  label: "New Equipment"    },
  { value: "OTHER",          label: "Other"            },
];

const PRIORITIES = [
  { value: "LOW",    label: "Low"    },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH",   label: "High"   },
  { value: "URGENT", label: "Urgent" },
];

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  OPEN:        { label: "Open",        bg: "bg-rose-50",    text: "text-rose-700",   icon: <Inbox        className="h-3.5 w-3.5" /> },
  IN_PROGRESS: { label: "In Progress", bg: "bg-blue-50",    text: "text-blue-700",   icon: <Clock        className="h-3.5 w-3.5" /> },
  RESOLVED:    { label: "Resolved",    bg: "bg-green-50",   text: "text-green-700",  icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  CLOSED:      { label: "Closed",      bg: "bg-slate-100",  text: "text-slate-500",  icon: <XCircle      className="h-3.5 w-3.5" /> },
  CANCELLED:   { label: "Cancelled",   bg: "bg-slate-100",  text: "text-slate-400",  icon: <AlertCircle  className="h-3.5 w-3.5" /> },
};

const PRIORITY_CONFIG: Record<string, { bg: string; text: string }> = {
  LOW:    { bg: "bg-slate-100",  text: "text-slate-500"  },
  MEDIUM: { bg: "bg-blue-100",   text: "text-blue-600"   },
  HIGH:   { bg: "bg-amber-100",  text: "text-amber-700"  },
  URGENT: { bg: "bg-red-100",    text: "text-red-700"    },
};

function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const INITIAL_FORM = { requestType: "SUPPORT", priority: "MEDIUM", subject: "", description: "" };

export default function EmployeeItRequestsPage() {
  const [requests, setRequests]       = useState<ItRequest[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [form, setForm]               = useState(INITIAL_FORM);
  const [message, setMessage]         = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [expanded, setExpanded]       = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/employee/it-requests");
      const json = await res.json() as { success: boolean; data: ItRequest[] };
      if (json.success) setRequests(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.subject.trim() || !form.description.trim()) {
      setMessage({ type: "error", text: "Please fill in all fields." });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const res  = await fetch("/api/employee/it-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json() as { success: boolean; error?: string };
      if (json.success) {
        setMessage({ type: "success", text: "Request submitted! Our IT team will be in touch." });
        setForm(INITIAL_FORM);
        setShowForm(false);
        void load();
      } else {
        setMessage({ type: "error", text: json.error ?? "Failed to submit request." });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-6 px-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">IT Support</h1>
          <p className="text-slate-500 text-sm mt-0.5">Submit a request or check your ticket status</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setMessage(null); }}
          className="flex items-center gap-2 bg-slate-900 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-slate-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Request
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium ${
          message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {message.text}
        </div>
      )}

      {/* New Request Form */}
      {showForm && (
        <form onSubmit={(e) => void handleSubmit(e)} className="bg-white border rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-800">New IT Request</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Request Type</label>
              <div className="relative">
                <select
                  value={form.requestType}
                  onChange={(e) => setForm({ ...form, requestType: e.target.value })}
                  className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 bg-white pr-8 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  {REQUEST_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Priority</label>
              <div className="relative">
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 bg-white pr-8 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Subject</label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="Brief description of the issue"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the issue in detail — what happened, what you need, any error messages…"
              rows={4}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => { setShowForm(false); setForm(INITIAL_FORM); }}
              className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit Request
            </button>
          </div>
        </form>
      )}

      {/* Requests list */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
          <Monitor className="h-10 w-10 text-slate-200" />
          <p className="text-sm font-medium">No requests yet</p>
          <p className="text-xs text-slate-400">Submit a request above and we&#39;ll get right on it.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const statusCfg   = STATUS_CONFIG[req.status] ?? { label: req.status, bg: "bg-slate-100", text: "text-slate-500", icon: null };
            const priorityCfg = PRIORITY_CONFIG[req.priority] ?? { bg: "bg-slate-100", text: "text-slate-500" };
            return (
              <div
                key={req.id}
                className="bg-white border rounded-2xl overflow-hidden"
              >
                <div
                  className="flex items-start gap-3 px-4 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpanded(expanded === req.id ? null : req.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-mono text-slate-400">{req.referenceNo}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}>
                        {statusCfg.icon}
                        {statusCfg.label}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${priorityCfg.bg} ${priorityCfg.text}`}>
                        {req.priority}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800">{req.subject}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{timeAgo(req.createdAt)}</p>
                  </div>
                </div>
                {expanded === req.id && (
                  <div className="px-4 pb-4 bg-slate-50 border-t border-slate-100">
                    <p className="text-sm text-slate-600 pt-3 leading-relaxed">{req.description}</p>
                    {req.resolvedAt && (
                      <p className="text-xs text-emerald-600 mt-2 font-medium">
                        ✓ Resolved {timeAgo(req.resolvedAt)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
