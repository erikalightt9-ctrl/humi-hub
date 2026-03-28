"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  LifeBuoy,
  Plus,
  Send,
  Loader2,
  ChevronLeft,
  Clock,
  MessageSquare,
  Paperclip,
  X,
  Download,
  AlertTriangle,
} from "lucide-react";
import {
  TICKET_CATEGORIES,
  TICKET_STATUSES,
  TICKET_PRIORITIES,
} from "@/lib/constants/communications";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface TicketAttachment {
  readonly url: string;
  readonly name: string;
  readonly size?: number;
  readonly mimeType?: string;
}

interface TicketResponse {
  readonly id: string;
  readonly authorType: string;
  readonly content: string;
  readonly isInternal: boolean;
  readonly attachments: TicketAttachment[] | null;
  readonly createdAt: string;
}

interface Ticket {
  readonly id: string;
  readonly referenceNo: string;
  readonly category: string;
  readonly priority: string;
  readonly status: string;
  readonly subject: string;
  readonly description: string;
  readonly slaDeadline: string | null;
  readonly createdAt: string;
  readonly _count?: { readonly responses: number };
  readonly responses?: readonly TicketResponse[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function statusBadge(status: string): string {
  return TICKET_STATUSES.find((t) => t.value === status)?.color ?? "bg-gray-100 text-gray-500";
}

function priorityBadge(priority: string): string {
  return TICKET_PRIORITIES.find((t) => t.value === priority)?.color ?? "bg-gray-100 text-gray-600";
}

function categoryLabel(cat: string): string {
  return TICKET_CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function slaInfo(ticket: Ticket): { label: string; overdue: boolean } | null {
  if (!ticket.slaDeadline || ticket.status === "RESOLVED" || ticket.status === "CLOSED") return null;
  const deadline = new Date(ticket.slaDeadline);
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();
  if (diffMs < 0) {
    const hoursAgo = Math.abs(Math.round(diffMs / 3_600_000));
    return { label: `SLA overdue by ${hoursAgo}h`, overdue: true };
  }
  const hoursLeft = Math.round(diffMs / 3_600_000);
  const label = hoursLeft < 1 ? "SLA: < 1h left" : `SLA: ${hoursLeft}h left`;
  return { label, overdue: false };
}

/* ------------------------------------------------------------------ */
/*  Attachment List                                                    */
/* ------------------------------------------------------------------ */

function AttachmentList({ attachments }: { attachments: TicketAttachment[] | null }) {
  if (!attachments || attachments.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {attachments.map((att, i) => (
        <a
          key={i}
          href={att.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs text-gray-700 transition"
        >
          <Download className="h-3 w-3" />
          <span className="max-w-[120px] truncate">{att.name}</span>
          {att.size && <span className="text-gray-400">({formatFileSize(att.size)})</span>}
        </a>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function SupportTicketView() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Create form state
  const [category, setCategory] = useState("TECHNICAL_SUPPORT");
  const [priority, setPriority] = useState("MEDIUM");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Reply state
  const [reply, setReply] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [replying, setReplying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Auto-refresh detail view every 30 s
  useEffect(() => {
    if (!selectedTicket) return;
    const id = setInterval(() => loadTicketDetail(selectedTicket.id), 30_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTicket?.id]);

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
        body: JSON.stringify({ category, priority, subject, description }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(`Ticket created: ${data.data.referenceNo}`);
        setSubject("");
        setDescription("");
        setCategory("TECHNICAL_SUPPORT");
        setPriority("MEDIUM");
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

  async function uploadFiles(): Promise<TicketAttachment[]> {
    const results: TicketAttachment[] = [];
    for (const file of pendingFiles) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/tickets/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) results.push(data.data as TicketAttachment);
    }
    return results;
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTicket || !reply.trim()) return;
    setReplying(true);
    try {
      const attachments = pendingFiles.length > 0 ? await uploadFiles() : [];
      const res = await fetch(`/api/tickets/${selectedTicket.id}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: reply, attachments }),
      });
      const data = await res.json();
      if (data.success) {
        setReply("");
        setPendingFiles([]);
        loadTicketDetail(selectedTicket.id);
      }
    } catch { /* ignore */ }
    setReplying(false);
  }

  /* ---------------------------------------------------------------- */
  /*  Detail View                                                      */
  /* ---------------------------------------------------------------- */

  if (selectedTicket) {
    const sla = slaInfo(selectedTicket);
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedTicket(null)}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
        >
          <ChevronLeft className="h-4 w-4" /> Back to tickets
        </button>

        {/* Ticket Header */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
            <div>
              <p className="text-xs text-gray-400 font-mono mb-1">{selectedTicket.referenceNo}</p>
              <h2 className="text-lg font-bold text-gray-900">{selectedTicket.subject}</h2>
              {sla && (
                <span
                  className={`inline-flex items-center gap-1 text-xs mt-1.5 px-2 py-0.5 rounded-full ${
                    sla.overdue ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {sla.overdue && <AlertTriangle className="h-3 w-3" />}
                  {sla.label}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`text-xs px-2.5 py-1 rounded-full ${statusBadge(selectedTicket.status)}`}>
                {TICKET_STATUSES.find((s) => s.value === selectedTicket.status)?.label}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full ${priorityBadge(selectedTicket.priority)}`}>
                {TICKET_PRIORITIES.find((p) => p.value === selectedTicket.priority)?.label ?? selectedTicket.priority}
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
            <div
              key={r.id}
              className={`rounded-xl p-4 ${
                r.authorType === "ADMIN"
                  ? "bg-blue-50 border border-blue-100 ml-4"
                  : "bg-white border border-gray-200 mr-4"
              }`}
            >
              <p className="text-xs font-medium text-gray-500 mb-1">
                {r.authorType === "ADMIN" ? "Support Team" : "You"} &bull;{" "}
                {new Date(r.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.content}</p>
              <AttachmentList attachments={r.attachments} />
            </div>
          ))}
        </div>

        {/* Reply form */}
        {selectedTicket.status !== "CLOSED" && (
          <form onSubmit={handleReply} className="bg-white rounded-xl shadow p-4 space-y-3">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Write a reply..."
              rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 resize-none"
            />

            {/* Pending files */}
            {pendingFiles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {pendingFiles.map((file, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded-lg text-xs text-gray-700">
                    <Paperclip className="h-3 w-3 text-gray-400" />
                    <span className="max-w-[120px] truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => setPendingFiles((prev) => prev.filter((_, idx) => idx !== i))}
                      className="text-gray-400 hover:text-red-500 ml-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
              >
                <Paperclip className="h-3.5 w-3.5" />
                Attach files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  setPendingFiles((prev) => [...prev, ...files].slice(0, 10));
                  e.target.value = "";
                }}
              />
              <button
                type="submit"
                disabled={replying || !reply.trim()}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {replying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Reply
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  List View                                                        */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support</h1>
          <p className="text-gray-500 text-sm mt-1">Submit and track support requests</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(""); setSuccess(""); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> New Ticket
        </button>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm">{success}</div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>
      )}

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl shadow p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">New Support Ticket</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                {TICKET_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                {TICKET_PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              placeholder="Brief summary of your issue"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              placeholder="Describe your issue in detail..."
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <LifeBuoy className="h-4 w-4" />}
              Submit Ticket
            </button>
          </div>
        </form>
      )}

      {/* Ticket List */}
      <div className="bg-white rounded-xl shadow">
        {loading ? (
          <div className="p-10 text-center text-gray-400">Loading...</div>
        ) : tickets.length === 0 ? (
          <div className="p-10 text-center">
            <LifeBuoy className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No support tickets yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Create your first ticket
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {tickets.map((t) => {
              const sla = slaInfo(t);
              return (
                <button
                  key={t.id}
                  onClick={() => loadTicketDetail(t.id)}
                  className="w-full text-left px-5 py-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-400">{t.referenceNo}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge(t.status)}`}>
                        {TICKET_STATUSES.find((s) => s.value === t.status)?.label}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${priorityBadge(t.priority)}`}>
                        {TICKET_PRIORITIES.find((p) => p.value === t.priority)?.label ?? t.priority}
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
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-400">{categoryLabel(t.category)}</p>
                    {sla && (
                      <span
                        className={`text-xs flex items-center gap-1 ${
                          sla.overdue ? "text-red-600" : "text-amber-600"
                        }`}
                      >
                        {sla.overdue && <AlertTriangle className="h-3 w-3" />}
                        {sla.label}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
