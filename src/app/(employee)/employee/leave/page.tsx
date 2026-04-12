"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  CalendarDays, Plus, Loader2, CheckCircle2, XCircle, Clock,
  AlertCircle, ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ─── Types ────────────────────────────────────────────────────────────────────

const LEAVE_TYPES = ["SICK", "VACATION", "EMERGENCY", "MATERNITY", "PATERNITY", "BEREAVEMENT", "OTHER"] as const;
type LeaveType = typeof LEAVE_TYPES[number];

interface LeaveRequest {
  id: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  reviewNote: string | null;
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING:   "bg-yellow-50 text-yellow-700 border-yellow-200",
  APPROVED:  "bg-green-50 text-green-700 border-green-200",
  REJECTED:  "bg-red-50 text-red-700 border-red-200",
  CANCELLED: "bg-gray-100 text-gray-500 border-gray-200",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EmployeeLeavePage() {
  const { data: session } = useSession();
  const user = session?.user as { name?: string } | undefined;

  const [requests, setRequests]     = useState<LeaveRequest[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage]       = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [leaveType, setLeaveType]   = useState<LeaveType>("SICK");
  const [startDate, setStartDate]   = useState("");
  const [endDate, setEndDate]       = useState("");
  const [reason, setReason]         = useState("");

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/employee/leave");
      const json = await res.json() as { success: boolean; data: LeaveRequest[] };
      if (json.success) setRequests(json.data);
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  function calcDays(start: string, end: string) {
    if (!start || !end) return 0;
    const ms   = new Date(end).getTime() - new Date(start).getTime();
    return Math.max(1, Math.round(ms / 86400000) + 1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!startDate || !endDate) { setMessage({ type: "error", text: "Start and end dates are required." }); return; }
    if (new Date(endDate) < new Date(startDate)) { setMessage({ type: "error", text: "End date must be after start date." }); return; }
    if (!reason.trim()) { setMessage({ type: "error", text: "Please provide a reason." }); return; }

    setSubmitting(true);
    try {
      const res  = await fetch("/api/employee/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaveType, startDate, endDate, reason: reason.trim() }),
      });
      const json = await res.json() as { success: boolean; error?: string };
      if (!json.success) {
        setMessage({ type: "error", text: json.error ?? "Failed to submit." });
      } else {
        setMessage({ type: "success", text: "Leave request submitted successfully." });
        setShowForm(false);
        setLeaveType("SICK");
        setStartDate("");
        setEndDate("");
        setReason("");
        await loadRequests();
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-lg mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <a href="/employee/attendance" className="text-gray-400 hover:text-gray-600">
              <ChevronLeft className="h-5 w-5" />
            </a>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Leave Requests</h1>
              <p className="text-sm text-gray-500">{user?.name}</p>
            </div>
          </div>
          {!showForm && (
            <Button size="sm" onClick={() => { setShowForm(true); setMessage(null); }}>
              <Plus className="h-4 w-4 mr-1" />New Request
            </Button>
          )}
        </div>

        {/* Message */}
        {message && (
          <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}>
            {message.type === "success"
              ? <CheckCircle2 className="h-4 w-4 shrink-0" />
              : <AlertCircle className="h-4 w-4 shrink-0" />}
            {message.text}
          </div>
        )}

        {/* New request form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-medium text-gray-900 mb-4">New Leave Request</h2>
            <form onSubmit={handleSubmit} className="space-y-4">

              <div className="space-y-1.5">
                <Label htmlFor="leave-type">Leave Type</Label>
                <select
                  id="leave-type"
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                >
                  {LEAVE_TYPES.map((t) => (
                    <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>
              </div>

              {startDate && endDate && (
                <p className="text-xs text-gray-500">
                  Total: <strong>{calcDays(startDate, endDate)} day{calcDays(startDate, endDate) !== 1 ? "s" : ""}</strong>
                </p>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="reason">Reason</Label>
                <textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Briefly describe your reason…"
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background resize-none"
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting…</> : "Submit Request"}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setMessage(null); }}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Leave list */}
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <CalendarDays className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No leave requests yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {requests.map((r) => (
              <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {r.leaveType.charAt(0) + r.leaveType.slice(1).toLowerCase()} Leave
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(r.startDate).toLocaleDateString()} – {new Date(r.endDate).toLocaleDateString()} · {r.totalDays} day{Number(r.totalDays) !== 1 ? "s" : ""}
                    </p>
                    {r.reason && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{r.reason}</p>}
                    {r.reviewNote && (
                      <p className="text-xs text-blue-600 mt-1">Note: {r.reviewNote}</p>
                    )}
                  </div>
                  <span className={`shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border ${STATUS_STYLES[r.status]}`}>
                    {r.status === "PENDING"   && <Clock className="h-3 w-3" />}
                    {r.status === "APPROVED"  && <CheckCircle2 className="h-3 w-3" />}
                    {r.status === "REJECTED"  && <XCircle className="h-3 w-3" />}
                    {r.status === "CANCELLED" && <XCircle className="h-3 w-3" />}
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
