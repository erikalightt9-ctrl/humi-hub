"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Inbox, Loader2, RefreshCw, CheckCircle2, Clock,
  XCircle, ChevronRight, AlertCircle, Monitor,
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
  submittedBy: { firstName: string; lastName: string; position: string } | null;
  asset: { assetTag: string; assetName: string } | null;
}

interface StatusCount { status: string; _count: { _all: number } }

const PRIORITY_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  LOW:    { label: "Low",    bg: "bg-slate-100",  text: "text-slate-500"  },
  MEDIUM: { label: "Medium", bg: "bg-blue-100",   text: "text-blue-600"   },
  HIGH:   { label: "High",   bg: "bg-amber-100",  text: "text-amber-700"  },
  URGENT: { label: "Urgent", bg: "bg-red-100",    text: "text-red-700"    },
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  OPEN:        { label: "Open",        bg: "bg-rose-100",   text: "text-rose-700",   icon: <Inbox          className="h-3.5 w-3.5" /> },
  IN_PROGRESS: { label: "In Progress", bg: "bg-blue-100",   text: "text-blue-700",   icon: <Clock          className="h-3.5 w-3.5" /> },
  RESOLVED:    { label: "Resolved",    bg: "bg-emerald-100",text: "text-emerald-700",icon: <CheckCircle2   className="h-3.5 w-3.5" /> },
  CLOSED:      { label: "Closed",      bg: "bg-slate-100",  text: "text-slate-500",  icon: <XCircle        className="h-3.5 w-3.5" /> },
  CANCELLED:   { label: "Cancelled",   bg: "bg-slate-100",  text: "text-slate-400",  icon: <AlertCircle    className="h-3.5 w-3.5" /> },
};

const TYPE_LABEL: Record<string, string> = {
  SUPPORT: "Support", ACCESS_REQUEST: "Access", HARDWARE_ISSUE: "Hardware",
  SOFTWARE_ISSUE: "Software", NEW_EQUIPMENT: "New Equipment", OTHER: "Other",
};

function PriorityBadge({ priority }: { priority: string }) {
  const cfg = PRIORITY_CONFIG[priority] ?? { label: priority, bg: "bg-slate-100", text: "text-slate-500" };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, bg: "bg-slate-100", text: "text-slate-500", icon: null };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const STATUS_TABS = [
  { value: "",            label: "All"         },
  { value: "OPEN",        label: "Open"        },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "RESOLVED",    label: "Resolved"    },
  { value: "CLOSED",      label: "Closed"      },
];

const NEXT_STATUS: Record<string, { label: string; next: string }[]> = {
  OPEN:        [{ label: "Start",   next: "IN_PROGRESS" }, { label: "Cancel", next: "CANCELLED"  }],
  IN_PROGRESS: [{ label: "Resolve", next: "RESOLVED"    }, { label: "Cancel", next: "CANCELLED"  }],
  RESOLVED:    [{ label: "Close",   next: "CLOSED"      }, { label: "Reopen", next: "OPEN"        }],
  CLOSED:      [{ label: "Reopen",  next: "OPEN"        }],
  CANCELLED:   [{ label: "Reopen",  next: "OPEN"        }],
};

export default function ItRequestsPage() {
  const [requests, setRequests]     = useState<ItRequest[]>([]);
  const [counts, setCounts]         = useState<StatusCount[]>([]);
  const [activeTab, setActiveTab]   = useState("");
  const [loading, setLoading]       = useState(true);
  const [updating, setUpdating]     = useState<string | null>(null);
  const [expanded, setExpanded]     = useState<string | null>(null);

  const load = useCallback(async (status = "") => {
    setLoading(true);
    try {
      const url = status ? `/api/admin/it/requests?status=${status}` : "/api/admin/it/requests";
      const res = await fetch(url);
      const json = await res.json() as { success: boolean; data: { requests: ItRequest[]; counts: StatusCount[] } };
      if (json.success) {
        setRequests(json.data.requests);
        setCounts(json.data.counts);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(activeTab); }, [load, activeTab]);

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    try {
      await fetch("/api/admin/it/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      void load(activeTab);
    } finally {
      setUpdating(null);
    }
  }

  function countFor(status: string) {
    if (!status) return counts.reduce((s, c) => s + c._count._all, 0);
    return counts.find((c) => c.status === status)?._count._all ?? 0;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
            <Link href="/admin/it" className="hover:text-slate-600">IT & Systems</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-slate-700 font-medium">IT Requests</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">IT Requests</h1>
          <p className="text-slate-500 text-sm mt-1">Support tickets, access requests, and hardware issues</p>
        </div>
        <button
          onClick={() => void load(activeTab)} disabled={loading}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 border border-slate-200 rounded-xl px-3 py-2 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 -mb-px ${
              activeTab === tab.value
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
              activeTab === tab.value ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
            }`}>
              {countFor(tab.value)}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
          <Inbox className="h-10 w-10 text-slate-300" />
          <p className="text-sm font-medium">No requests found</p>
        </div>
      ) : (
        <div className="bg-white border rounded-2xl divide-y divide-slate-100 overflow-hidden">
          {requests.map((req) => (
            <div key={req.id}>
              <div
                className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => setExpanded(expanded === req.id ? null : req.id)}
              >
                {/* Priority + Type */}
                <div className="flex flex-col gap-1.5 shrink-0 pt-0.5">
                  <PriorityBadge priority={req.priority} />
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
                    {TYPE_LABEL[req.requestType] ?? req.requestType}
                  </span>
                </div>

                {/* Main content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-400 font-mono">{req.referenceNo}</span>
                    <StatusBadge status={req.status} />
                  </div>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5 truncate">{req.subject}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {req.submittedBy
                      ? `${req.submittedBy.firstName} ${req.submittedBy.lastName}${req.submittedBy.position ? ` · ${req.submittedBy.position}` : ""}`
                      : "Unknown"
                    }
                    {" · "}
                    {timeAgo(req.createdAt)}
                  </p>
                </div>

                {/* Asset */}
                {req.asset && (
                  <div className="hidden sm:flex items-center gap-1.5 shrink-0 text-xs text-slate-500 bg-slate-50 border rounded-lg px-2.5 py-1.5">
                    <Monitor className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-medium">{req.asset.assetTag}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {(NEXT_STATUS[req.status] ?? []).map((action) => (
                    <button
                      key={action.next}
                      disabled={updating === req.id}
                      onClick={() => void updateStatus(req.id, action.next)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                        action.next === "RESOLVED" || action.next === "CLOSED"
                          ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
                          : action.next === "IN_PROGRESS"
                          ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                          : action.next === "CANCELLED"
                          ? "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {updating === req.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : action.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Expanded description */}
              {expanded === req.id && (
                <div className="px-5 pb-4 bg-slate-50 border-t border-slate-100">
                  <p className="text-sm text-slate-600 pt-3 leading-relaxed">{req.description}</p>
                  {req.resolvedAt && (
                    <p className="text-xs text-slate-400 mt-2">
                      Resolved {timeAgo(req.resolvedAt)}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
