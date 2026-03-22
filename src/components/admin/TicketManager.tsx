"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Ticket,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  User,
  Clock,
  Send,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Inbox,
  Activity,
  Paperclip,
  X,
  Download,
} from "lucide-react";
import {
  TICKET_CATEGORIES,
  TICKET_STATUSES,
  TICKET_PRIORITIES,
  ACTOR_TYPE_LABELS,
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
  readonly authorId: string;
  readonly content: string;
  readonly isInternal: boolean;
  readonly attachments: TicketAttachment[] | null;
  readonly createdAt: string;
}

interface TicketItem {
  readonly id: string;
  readonly referenceNo: string;
  readonly category: string;
  readonly priority: string;
  readonly status: string;
  readonly subject: string;
  readonly description: string;
  readonly submitterType: string;
  readonly submitterId: string;
  readonly assignedToId: string | null;
  readonly slaDeadline: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly responses: readonly TicketResponse[];
}

interface KpiStats {
  readonly open: number;
  readonly inProgress: number;
  readonly resolved: number;
  readonly overdue: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function statusBadge(status: string): string {
  return TICKET_STATUSES.find((s) => s.value === status)?.color ?? "bg-gray-100 text-gray-600";
}

function priorityBadge(priority: string): string {
  return TICKET_PRIORITIES.find((p) => p.value === priority)?.color ?? "bg-gray-100 text-gray-600";
}

function label(value: string, list: readonly { readonly value: string; readonly label: string }[]): string {
  return list.find((i) => i.value === value)?.label ?? value;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isOverdue(slaDeadline: string | null, status: string): boolean {
  if (!slaDeadline || status === "RESOLVED" || status === "CLOSED") return false;
  return new Date(slaDeadline) < new Date();
}

function slaLabel(slaDeadline: string | null, status: string): string | null {
  if (!slaDeadline || status === "RESOLVED" || status === "CLOSED") return null;
  const deadline = new Date(slaDeadline);
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();
  if (diffMs < 0) {
    const hoursAgo = Math.abs(Math.round(diffMs / 3_600_000));
    return `Overdue by ${hoursAgo}h`;
  }
  const hoursLeft = Math.round(diffMs / 3_600_000);
  if (hoursLeft < 1) return `< 1h left`;
  return `${hoursLeft}h left`;
}

/* ------------------------------------------------------------------ */
/*  KPI Cards                                                          */
/* ------------------------------------------------------------------ */

function KpiCards({ stats, loading }: { stats: KpiStats | null; loading: boolean }) {
  const cards = [
    {
      label: "Open",
      value: stats?.open ?? 0,
      icon: Inbox,
      bg: "bg-blue-50",
      text: "text-blue-700",
      ring: "ring-blue-100",
    },
    {
      label: "In Progress",
      value: stats?.inProgress ?? 0,
      icon: Activity,
      bg: "bg-amber-50",
      text: "text-amber-700",
      ring: "ring-amber-100",
    },
    {
      label: "Resolved",
      value: stats?.resolved ?? 0,
      icon: CheckCircle2,
      bg: "bg-green-50",
      text: "text-green-700",
      ring: "ring-green-100",
    },
    {
      label: "Overdue",
      value: stats?.overdue ?? 0,
      icon: AlertTriangle,
      bg: "bg-red-50",
      text: "text-red-700",
      ring: "ring-red-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {cards.map(({ label: cardLabel, value, icon: Icon, bg, text, ring }) => (
        <div
          key={cardLabel}
          className={`${bg} ring-1 ${ring} rounded-xl p-4 flex items-center gap-3`}
        >
          <div className={`p-2 rounded-lg ${bg}`}>
            <Icon className={`h-5 w-5 ${text}`} />
          </div>
          <div>
            <p className="text-xs text-gray-500">{cardLabel}</p>
            {loading ? (
              <div className="h-6 w-8 bg-gray-200 animate-pulse rounded mt-0.5" />
            ) : (
              <p className={`text-xl font-bold ${text}`}>{value}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
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

export function TicketManager() {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<KpiStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/tickets/stats");
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch { /* ignore */ }
    setStatsLoading(false);
  }, []);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (categoryFilter) params.set("category", categoryFilter);
      if (priorityFilter) params.set("priority", priorityFilter);
      if (search) params.set("search", search);
      const qs = params.toString();
      const res = await fetch(`/api/admin/tickets${qs ? `?${qs}` : ""}`);
      const data = await res.json();
      if (data.success) setTickets(data.data.data);
    } catch { /* ignore */ }
    setLoading(false);
  }, [statusFilter, categoryFilter, priorityFilter, search]);

  useEffect(() => {
    fetchStats();
    fetchTickets();
  }, [fetchStats, fetchTickets]);

  // Auto-refresh detail view every 30 s
  useEffect(() => {
    if (!selectedTicket) return;
    const id = setInterval(() => fetchTicketDetail(selectedTicket.id), 30_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTicket?.id]);

  const fetchTicketDetail = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/tickets/${id}`);
      const data = await res.json();
      if (data.success) setSelectedTicket(data.data);
    } catch { /* ignore */ }
  }, []);

  async function handleStatusChange(ticketId: string, newStatus: string) {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchTickets();
        fetchStats();
        if (selectedTicket?.id === ticketId) fetchTicketDetail(ticketId);
      }
    } catch { /* ignore */ }
    setUpdating(false);
  }

  async function handlePriorityChange(ticketId: string, newPriority: string) {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority }),
      });
      const data = await res.json();
      if (data.success) {
        fetchTickets();
        if (selectedTicket?.id === ticketId) fetchTicketDetail(ticketId);
      }
    } catch { /* ignore */ }
    setUpdating(false);
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
    if (!selectedTicket || !replyContent.trim()) return;
    setSending(true);
    try {
      const attachments = pendingFiles.length > 0 ? await uploadFiles() : [];
      const res = await fetch(`/api/tickets/${selectedTicket.id}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent, isInternal, attachments }),
      });
      const data = await res.json();
      if (data.success) {
        setReplyContent("");
        setIsInternal(false);
        setPendingFiles([]);
        fetchTicketDetail(selectedTicket.id);
        fetchStats();
      }
    } catch { /* ignore */ }
    setSending(false);
  }

  /* ---------------------------------------------------------------- */
  /*  Detail View                                                      */
  /* ---------------------------------------------------------------- */

  if (selectedTicket) {
    const overdue = isOverdue(selectedTicket.slaDeadline, selectedTicket.status);
    const sla = slaLabel(selectedTicket.slaDeadline, selectedTicket.status);

    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedTicket(null)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to tickets
        </button>

        {/* Ticket Header */}
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <p className="text-xs text-gray-400 font-mono">{selectedTicket.referenceNo}</p>
              <h2 className="text-lg font-bold text-gray-900 mt-1">{selectedTicket.subject}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-500">
                <User className="h-3 w-3" />
                <span>{ACTOR_TYPE_LABELS[selectedTicket.submitterType] ?? "User"}</span>
                <span>·</span>
                <Clock className="h-3 w-3" />
                <span>{new Date(selectedTicket.createdAt).toLocaleDateString()}</span>
                {sla && (
                  <>
                    <span>·</span>
                    <span className={`flex items-center gap-1 ${overdue ? "text-red-600 font-medium" : "text-amber-600"}`}>
                      {overdue && <AlertTriangle className="h-3 w-3" />}
                      SLA: {sla}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <select
                value={selectedTicket.status}
                onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value)}
                disabled={updating}
                className="text-xs border rounded-lg px-2 py-1"
              >
                {TICKET_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <select
                value={selectedTicket.priority}
                onChange={(e) => handlePriorityChange(selectedTicket.id, e.target.value)}
                disabled={updating}
                className="text-xs border rounded-lg px-2 py-1"
              >
                {TICKET_PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge(selectedTicket.status)}`}>
              {label(selectedTicket.status, TICKET_STATUSES)}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${priorityBadge(selectedTicket.priority)}`}>
              {label(selectedTicket.priority, TICKET_PRIORITIES)}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
              {label(selectedTicket.category, TICKET_CATEGORIES)}
            </span>
            {overdue && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Overdue
              </span>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
            {selectedTicket.description}
          </div>
        </div>

        {/* Responses */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">
            Responses ({selectedTicket.responses.length})
          </h3>
          {selectedTicket.responses.map((resp) => (
            <div
              key={resp.id}
              className={`bg-white rounded-lg shadow-sm p-4 border-l-4 ${
                resp.isInternal
                  ? "border-yellow-400 bg-yellow-50"
                  : resp.authorType === "ADMIN"
                  ? "border-blue-400"
                  : "border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                <span className="font-medium text-gray-700">
                  {ACTOR_TYPE_LABELS[resp.authorType] ?? "User"}
                </span>
                {resp.isInternal && (
                  <span className="bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded text-[10px]">
                    Internal Note
                  </span>
                )}
                <span>·</span>
                <span>{new Date(resp.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{resp.content}</p>
              <AttachmentList attachments={resp.attachments} />
            </div>
          ))}
        </div>

        {/* Reply Form */}
        <form onSubmit={handleReply} className="bg-white rounded-xl shadow p-4 space-y-3">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Type your response..."
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
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

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Internal note
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
              >
                <Paperclip className="h-3.5 w-3.5" />
                Attach
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
            </div>
            <button
              type="submit"
              disabled={sending || !replyContent.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {isInternal ? "Add Note" : "Send Reply"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  List View                                                        */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-500 text-sm mt-1">Manage all support requests</p>
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Filter className="h-4 w-4" />
          Filters
          {showFilters ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>
      </div>

      {/* KPI Cards */}
      <KpiCards stats={stats} loading={statsLoading} />

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow p-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">All Statuses</option>
            {TICKET_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">All Categories</option>
            {TICKET_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">All Priorities</option>
            {TICKET_PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="p-8 text-center">
            <Ticket className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No tickets found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">SLA</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tickets.map((ticket) => {
                  const overdueRow = isOverdue(ticket.slaDeadline, ticket.status);
                  const sla = slaLabel(ticket.slaDeadline, ticket.status);
                  return (
                    <tr key={ticket.id} className={`hover:bg-gray-50 ${overdueRow ? "bg-red-50/40" : ""}`}>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">
                        {ticket.referenceNo}
                        {overdueRow && <AlertTriangle className="inline h-3 w-3 text-red-500 ml-1" />}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800 max-w-xs truncate">
                        {ticket.subject}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {label(ticket.category, TICKET_CATEGORIES)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${priorityBadge(ticket.priority)}`}>
                          {label(ticket.priority, TICKET_PRIORITIES)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge(ticket.status)}`}>
                          {label(ticket.status, TICKET_STATUSES)}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-xs ${overdueRow ? "text-red-600 font-medium" : "text-amber-600"}`}>
                        {sla ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => fetchTicketDetail(ticket.id)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
