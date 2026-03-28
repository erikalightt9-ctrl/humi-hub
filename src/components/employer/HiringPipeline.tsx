"use client";

import { useState } from "react";
import {
  CheckCircle2, Clock, Search, Video, Star, XCircle, ChevronDown,
} from "lucide-react";

type HiringStage = "APPLIED" | "REVIEWED" | "INTERVIEW" | "OFFER" | "HIRED" | "REJECTED";

interface Application {
  id: string;
  applicantName: string;
  applicantEmail: string;
  stage: HiringStage;
  createdAt: string;
  interviewDate?: string | null;
  zoomJoinUrl?: string | null;
  coverLetter: string;
  jobPosting?: { title: string };
}

const STAGES: { key: HiringStage; label: string; color: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "APPLIED", label: "Applied", color: "bg-gray-100 text-gray-700", icon: Clock },
  { key: "REVIEWED", label: "Reviewed", color: "bg-blue-100 text-blue-700", icon: Search },
  { key: "INTERVIEW", label: "Interview", color: "bg-purple-100 text-purple-700", icon: Video },
  { key: "OFFER", label: "Offer", color: "bg-amber-100 text-amber-700", icon: Star },
  { key: "HIRED", label: "Hired", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  { key: "REJECTED", label: "Rejected", color: "bg-red-100 text-red-700", icon: XCircle },
];

function StageBadge({ stage }: { stage: HiringStage }) {
  const s = STAGES.find((x) => x.key === stage)!;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${s.color}`}>
      <Icon className="h-3 w-3" />
      {s.label}
    </span>
  );
}

function ApplicationCard({ app, onStageChange }: {
  app: Application;
  onStageChange: (id: string, stage: HiringStage) => void;
}) {
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  async function moveStage(newStage: HiringStage) {
    setUpdating(true);
    await fetch(`/api/employer/applications/${app.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: newStage }),
    });
    setUpdating(false);
    onStageChange(app.id, newStage);
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-gray-900 truncate">{app.applicantName}</p>
            <StageBadge stage={app.stage} />
          </div>
          <p className="text-sm text-gray-500">{app.applicantEmail}</p>
          {app.jobPosting && (
            <p className="text-xs text-blue-600 mt-1">{app.jobPosting.title}</p>
          )}
          {app.zoomJoinUrl && (
            <a
              href={app.zoomJoinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-purple-600 font-semibold mt-1 hover:underline"
            >
              <Video className="h-3 w-3" /> Join Zoom Interview
            </a>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setOpen((o) => !o)}
            disabled={updating}
            className="flex items-center gap-1 text-xs text-gray-600 border border-gray-300 rounded-lg px-2 py-1.5 hover:bg-gray-50 disabled:opacity-50"
          >
            Move to <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
          {STAGES.filter((s) => s.key !== app.stage).map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.key}
                onClick={() => { moveStage(s.key); setOpen(false); }}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold ${s.color} hover:opacity-80 transition-opacity`}
              >
                <Icon className="h-3 w-3" /> {s.label}
              </button>
            );
          })}
        </div>
      )}

      {app.coverLetter && (
        <details className="mt-3">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">View cover letter</summary>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed whitespace-pre-line">
            {app.coverLetter.slice(0, 400)}{app.coverLetter.length > 400 ? "…" : ""}
          </p>
        </details>
      )}
    </div>
  );
}

export function HiringPipeline({ initialApplications }: { initialApplications: Application[] }) {
  const [applications, setApplications] = useState(initialApplications);
  const [filter, setFilter] = useState<HiringStage | "ALL">("ALL");

  function handleStageChange(id: string, newStage: HiringStage) {
    setApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, stage: newStage } : a))
    );
  }

  const filtered = filter === "ALL"
    ? applications
    : applications.filter((a) => a.stage === filter);

  const counts = Object.fromEntries(
    STAGES.map((s) => [s.key, applications.filter((a) => a.stage === s.key).length])
  ) as Record<HiringStage, number>;

  return (
    <div>
      {/* Stage filter tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        <button
          onClick={() => setFilter("ALL")}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
            filter === "ALL" ? "bg-blue-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All ({applications.length})
        </button>
        {STAGES.map((s) => (
          <button
            key={s.key}
            onClick={() => setFilter(s.key)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              filter === s.key ? "bg-blue-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {s.label} ({counts[s.key]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No applications {filter !== "ALL" ? `in ${filter}` : ""} yet.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => (
            <ApplicationCard key={app.id} app={app} onStageChange={handleStageChange} />
          ))}
        </div>
      )}
    </div>
  );
}
