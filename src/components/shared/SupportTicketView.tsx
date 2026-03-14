"use client";

import { useState, useEffect, useCallback } from "react";
import { LifeBuoy, Plus, Send, Loader2, ChevronLeft, Clock, MessageSquare } from "lucide-react";
import { TICKET_CATEGORIES, TICKET_STATUSES, TICKET_PRIORITIES } from "@/lib/constants/communications";

interface Ticket {
  readonly id: string;
  readonly referenceNo: string;
  readonly category: string;
  readonly priority: string;
  readonly status: string;
  readonly subject: string;
  readonly description: string;
  readonly createdAt: string;
  readonly _count?: { readonly responses: number };
  readonly responses?: readonly TicketResponse[];
}

interface TicketResponse {
  readonly id: string;
  readonly authorType: string;
  readonly content: string;
  readonly isInternal: boolean;
  readonly createdAt: string;
}

function statusBadge(status: string) {
  const s = TICKET_STATUSES.find((t) => t.value === status);
  return s?.color ?? "bg-gray-100 text-gray-500";
}

function priorityBadge(priority: string) {
  const p = TICKET_PRIORITIES.find((t) => t.value === priority);
  return p?.color ?? "bg-gray-100 text-gray-600";
}

function categoryLabel(cat: string) {
  return TICKET_CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
}

export function SupportTicketView() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [category, setCategory] = useState("TECHNICAL_SUPPORT");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Reply state
  const [reply, setReply] = useState("");
  const [replying, setReplying] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tickets");
      const data = await res.json();
      if (data.success) setTickets(data.data.data);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  async function loadTicketDetail(id: string) {
    const res = await fetch(`/api/tickets/${id}`);
    const data = await res.json();
    if (data.success) setSelectedTicket(data.data);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, subject, description }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(`Ticket created: ${data.data.referenceNo}`);
        setSubject("");
        setDescription("");
        setShowForm(false);
        fetchTickets();
      } else {
        setError(data.error ?? "Failed to create ticket");
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTicket || !reply.trim()) return;
    setReplying(true);
    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: reply }),
      });
      const data = await res.json();
      if (data.success) {
        setReply("");
        loadTicketDetail(selectedTicket.id);
      }
    } catch { /* ignore */ }
    setReplying(false);
  }

  // Ticket Detail View
  if (selectedTicket) {
    return (
      <div className="space-y-4">
        <button onClick={() => setSelectedTicket(null)} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
          <ChevronLeft className="h-4 w-4" /> Back to tickets
        </button>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-gray-400 font-mono mb-1">{selectedTicket.referenceNo}</p>
              <h2 className="text-lg font-bold text-gray-900">{selectedTicket.subject}</h2>
            </div>
            <div className="flex gap-2">
              <span className={`text-xs px-2.5 py-1 rounded-full ${statusBadge(selectedTicket.status)}`}>
                {TICKET_STATUSES.find((s) => s.value === selectedTicket.status)?.label}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full ${priorityBadge(selectedTicket.priority)}`}>
                {selectedTicket.priority}
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedTicket.description}</p>
          <p className="text-xs text-gray-400 mt-3">
            {categoryLabel(selectedTicket.category)} &bull; {new Date(selectedTicket.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Responses */}
        <div className="space-y-3">
          {(selectedTicket.responses ?? []).map((r) => (
            <div key={r.id} className={`rounded-xl p-4 ${r.authorType === "ADMIN" ? "bg-blue-50 border border-blue-100 ml-4" : "bg-white border border-gray-200 mr-4"}`}>
              <p className="text-xs font-medium text-gray-500 mb-1">
                {r.authorType === "ADMIN" ? "Support Team" : "You"} &bull;{" "}
                {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              </p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.content}</p>
            </div>
          ))}
        </div>

        {/* Reply form */}
        {selectedTicket.status !== "CLOSED" && (
          <form onSubmit={handleReply} className="bg-white rounded-xl shadow p-4">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Write a reply..."
              rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 mb-3"
            />
            <div className="flex justify-end">
              <button type="submit" disabled={replying || !reply.trim()} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                {replying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Reply
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  // Ticket List View
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support</h1>
          <p className="text-gray-500 text-sm mt-1">Submit and track support requests</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setError(""); setSuccess(""); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          <Plus className="h-4 w-4" /> New Ticket
        </button>
      </div>

      {success && <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm">{success}</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>}

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl shadow p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">New Support Ticket</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1">
                {TICKET_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Subject</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} required placeholder="Brief summary of your issue" className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={4} placeholder="Describe your issue in detail..." className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
            <button type="submit" disabled={saving} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <LifeBuoy className="h-4 w-4" />}
              Submit Ticket
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow">
        {loading ? (
          <div className="p-10 text-center text-gray-400">Loading...</div>
        ) : tickets.length === 0 ? (
          <div className="p-10 text-center">
            <LifeBuoy className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No support tickets yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {tickets.map((t) => (
              <button key={t.id} onClick={() => loadTicketDetail(t.id)} className="w-full text-left px-5 py-4 hover:bg-gray-50 transition">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-400">{t.referenceNo}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge(t.status)}`}>
                      {TICKET_STATUSES.find((s) => s.value === t.status)?.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <MessageSquare className="h-3.5 w-3.5" />
                    {t._count?.responses ?? 0}
                    <Clock className="h-3.5 w-3.5 ml-2" />
                    {new Date(t.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-800">{t.subject}</p>
                <p className="text-xs text-gray-400 mt-1">{categoryLabel(t.category)}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
