"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Briefcase,
  Loader2,
  MapPin,
  Building2,
  Sparkles,
  Search,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface JobPosting {
  readonly id: string;
  readonly title: string;
  readonly company: string;
  readonly description: string;
  readonly requirements: ReadonlyArray<string>;
  readonly skills: ReadonlyArray<string>;
  readonly courseSlug: string | null;
  readonly location: string;
  readonly type: string;
  readonly salaryRange: string | null;
  readonly isActive: boolean;
}

interface JobMatch {
  readonly id: string;
  readonly studentId: string;
  readonly jobPostingId: string;
  readonly matchScore: number;
  readonly aiReasoning: string;
  readonly matchedAt: string;
  readonly jobPosting: JobPosting;
}

interface MatchData {
  readonly matches: ReadonlyArray<JobMatch>;
  readonly canRefresh: boolean;
}

/* ------------------------------------------------------------------ */
/*  Score display helpers                                              */
/* ------------------------------------------------------------------ */

function scoreColor(score: number): string {
  if (score >= 75) return "text-green-600";
  if (score >= 50) return "text-yellow-600";
  return "text-orange-500";
}

function scoreBg(score: number): string {
  if (score >= 75) return "bg-green-50 border-green-200";
  if (score >= 50) return "bg-yellow-50 border-yellow-200";
  return "bg-orange-50 border-orange-200";
}

function scoreRingColor(score: number): string {
  if (score >= 75) return "stroke-green-500";
  if (score >= 50) return "stroke-yellow-500";
  return "stroke-orange-500";
}

/* ------------------------------------------------------------------ */
/*  Circular score indicator                                           */
/* ------------------------------------------------------------------ */

function ScoreCircle({ score }: { readonly score: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-[72px] h-[72px] shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
        {/* Background ring */}
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="5"
        />
        {/* Score ring */}
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          className={scoreRingColor(score)}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-sm font-bold ${scoreColor(score)}`}>
          {score}%
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function JobMatchDashboard() {
  const [data, setData] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---------------------------------------------------------------- */
  /*  Fetch existing matches                                           */
  /* ---------------------------------------------------------------- */

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/student/job-matches");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error ?? "Failed to load matches");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ---------------------------------------------------------------- */
  /*  Trigger matching                                                 */
  /* ---------------------------------------------------------------- */

  const handleMatch = useCallback(async () => {
    setMatching(true);
    setError(null);

    try {
      const res = await fetch("/api/student/job-matches", { method: "POST" });
      const json = await res.json();

      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error ?? "Failed to run job matching");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setMatching(false);
    }
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Loading state                                                    */
  /* ---------------------------------------------------------------- */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Error state (no data at all)                                     */
  /* ---------------------------------------------------------------- */

  if (error && !data) {
    return (
      <div className="bg-red-50 rounded-xl border border-red-200 p-6 text-center">
        <p className="text-red-600">{error}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => {
            setError(null);
            setLoading(true);
            fetchData();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  const matches = data?.matches ?? [];
  const canRefresh = data?.canRefresh ?? true;

  /* ---------------------------------------------------------------- */
  /*  Empty state — no matches yet                                     */
  /* ---------------------------------------------------------------- */

  if (matches.length === 0 && !matching) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
        <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <Search className="h-8 w-8 text-indigo-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          No Job Matches Yet
        </h2>
        <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
          Let our AI analyze your skills, training progress, and badges to find
          the best job opportunities for you.
        </p>
        <Button onClick={handleMatch} disabled={matching} className="gap-2">
          {matching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {matching ? "Finding Matches..." : "Find My Matches"}
        </Button>
        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Matches list                                                     */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-6">
      {/* Match button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {matches.length} match{matches.length !== 1 ? "es" : ""} found
        </p>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={handleMatch}
          disabled={matching || !canRefresh}
        >
          {matching ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {matching ? "Matching..." : "Find My Matches"}
        </Button>
      </div>

      {!canRefresh && !matching && (
        <p className="text-xs text-gray-400">
          Job matching can be refreshed once every 24 hours
        </p>
      )}

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {/* Matching in progress */}
      {matching && (
        <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mx-auto mb-3" />
          <p className="text-sm text-indigo-700 font-medium">
            AI is analyzing your profile and matching you to jobs...
          </p>
          <p className="text-xs text-indigo-500 mt-1">
            This may take a moment
          </p>
        </div>
      )}

      {/* Match cards */}
      <div className="space-y-4">
        {matches.map((match) => (
          <div
            key={match.id}
            className="bg-white rounded-xl border border-gray-200 p-5"
          >
            <div className="flex gap-4">
              {/* Score circle */}
              <ScoreCircle score={match.matchScore} />

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Title row */}
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-semibold text-gray-900">
                    {match.jobPosting.title}
                  </h3>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 ml-2 ${scoreBg(match.matchScore)}`}
                  >
                    <span className={scoreColor(match.matchScore)}>
                      {match.matchScore}% Match
                    </span>
                  </span>
                </div>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-3">
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {match.jobPosting.company}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {match.jobPosting.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    {match.jobPosting.type}
                  </span>
                  {match.jobPosting.salaryRange && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {match.jobPosting.salaryRange}
                    </span>
                  )}
                </div>

                {/* AI Reasoning */}
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                    <span className="text-xs font-medium text-gray-600">
                      AI Analysis
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {match.aiReasoning}
                  </p>
                </div>

                {/* Skills tags */}
                <div className="flex flex-wrap gap-1.5">
                  {match.jobPosting.skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
