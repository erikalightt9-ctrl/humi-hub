"use client";

import { useState, useEffect, useCallback } from "react";
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

interface TicketResponse {
  readonly id: string;
  readonly authorType: string;
  readonly authorId: string;
  readonly content: string;
  readonly isInternal: boolean;
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
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly responses: readonly TicketResponse[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function statusBadge(status: string): string {
  const found = TICKET_STATUSES.find((s) => s.value === status);
  return found?.color ?? "bg-gray-100 text-gray-600";
}

function priorityBadge(priority: string): string {
  const found = TICKET_PRIORITIES.find((p) => p.value === priority);
  return found?.color ?? "bg-gray-100 text-gray-600";
}

function label(value: string, list: readonly { readonly value: string; readonly label: string }[]): string {
  return list.find((i) => i.value === value)?.label ?? value;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function TicketManager() {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const fetchTickets = useCallback(async () => {
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
    fetchTickets();
  }, [fetchTickets]);

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

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTicket || !replyContent.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent, isInternal }),
      });
      const data = await res.json();
      if (data.success) {
        setReplyContent("");
        setIsInternal(false);
        fetchTicketDetail(selectedTicket.id);
      }
    } catch { /* ignore */ }
    setSending(false);
  }

  /* ---------------------------------------------------------------- */
  /*  Ticket Detail View                                               */
  /* ---------------------------------------------------------------- */

  if (selectedTicket) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedTicket(null)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to tickets
        </button>

        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400 font-mono">{selectedTicket.referenceNo}</p>
              <h2 className="text-lg font-bold text-gray-900 mt-1">{selectedTicket.subject}</h2>
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                <User className="h-3 w-3" />
                <span>{ACTOR_TYPE_LABELS[selectedTicket.submitterType] ?? "User"}</span>
                <span>·</span>
                <Clock className="h-3 w-3" />
                <span>{new Date(selectedTicket.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex gap-2">
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

          <div className="flex gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge(selectedTicket.status)}`}>
              {label(selectedTicket.status, TICKET_STATUSES)}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${priorityBadge(selectedTicket.priority)}`}>
              {label(selectedTicket.priority, TICKET_PRIORITIES)}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
              {label(selectedTicket.category, TICKET_CATEGORIES)}
            </span>
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
                  : "border-blue-400"
              }`}
            >
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                <span className="font-medium">
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
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-gray-500">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="rounded border-gray-300"
              />
              Internal note (not visible to submitter)
            </label>
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
  /*  Ticket List View                                                 */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-6">
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
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {ticket.referenceNo}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800 max-w-xs truncate">
                      {ticket.subject}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
