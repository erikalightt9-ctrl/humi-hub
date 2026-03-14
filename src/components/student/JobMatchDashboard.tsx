"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Briefcase,
  Loader2,
  MapPin,
  Building2,
  Sparkles,
  Search,
  DollarSign,
  ExternalLink,
  Filter,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  JOB_INDUSTRIES,
  JOB_TYPE_OPTIONS,
} from "@/lib/constants/job-skill-mappings";

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
  readonly industry: string | null;
  readonly isActive: boolean;
  readonly externalSource: string | null;
  readonly externalUrl: string | null;
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
/*  Source badge                                                        */
/* ------------------------------------------------------------------ */

const SOURCE_LABELS: Readonly<Record<string, string>> = {
  remotive: "Remotive",
  jsearch: "JSearch",
};

const SOURCE_COLORS: Readonly<Record<string, string>> = {
  remotive: "bg-purple-100 text-purple-700",
  jsearch: "bg-teal-100 text-teal-700",
};

function SourceBadge({ source }: { readonly source: string | null }) {
  if (!source) return null;
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${SOURCE_COLORS[source] ?? "bg-gray-100 text-gray-600"}`}
    >
      {SOURCE_LABELS[source] ?? source}
    </span>
  );
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
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="5"
        />
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
/*  Filter panel                                                       */
/* ------------------------------------------------------------------ */

interface FilterState {
  readonly search: string;
  readonly jobType: string;
  readonly industry: string;
  readonly source: string;
  readonly minScore: number;
}

const INITIAL_FILTERS: FilterState = {
  search: "",
  jobType: "",
  industry: "",
  source: "",
  minScore: 0,
};

function FilterPanel({
  filters,
  onFiltersChange,
  matchCount,
  filteredCount,
}: {
  readonly filters: FilterState;
  readonly onFiltersChange: (filters: FilterState) => void;
  readonly matchCount: number;
  readonly filteredCount: number;
}) {
  const hasActiveFilters =
    filters.search !== "" ||
    filters.jobType !== "" ||
    filters.industry !== "" ||
    filters.source !== "" ||
    filters.minScore > 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Filter Matches
          </span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={() => onFiltersChange(INITIAL_FILTERS)}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Keyword search */}
        <div className="relative lg:col-span-1">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
          <Input
            value={filters.search}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value })
            }
            placeholder="Search jobs..."
            className="pl-8 h-9 text-sm"
          />
        </div>

        {/* Job type */}
        <select
          value={filters.jobType}
          onChange={(e) =>
            onFiltersChange({ ...filters, jobType: e.target.value })
          }
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">All Types</option>
          {JOB_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Industry */}
        <select
          value={filters.industry}
          onChange={(e) =>
            onFiltersChange({ ...filters, industry: e.target.value })
          }
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">All Industries</option>
          {JOB_INDUSTRIES.map((industry) => (
            <option key={industry} value={industry}>
              {industry}
            </option>
          ))}
        </select>

        {/* Source */}
        <select
          value={filters.source}
          onChange={(e) =>
            onFiltersChange({ ...filters, source: e.target.value })
          }
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">All Sources</option>
          <option value="manual">Manual</option>
          <option value="remotive">Remotive</option>
          <option value="jsearch">JSearch</option>
        </select>

        {/* Min score */}
        <select
          value={filters.minScore}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              minScore: Number(e.target.value),
            })
          }
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value={0}>Any Score</option>
          <option value={50}>50%+ Match</option>
          <option value={60}>60%+ Match</option>
          <option value={75}>75%+ Match</option>
          <option value={90}>90%+ Match</option>
        </select>
      </div>

      {hasActiveFilters && (
        <p className="text-xs text-gray-400 mt-2">
          Showing {filteredCount} of {matchCount} matches
        </p>
      )}
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
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);

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
  /*  Filter matches client-side                                       */
  /* ---------------------------------------------------------------- */

  const filteredMatches = useMemo(() => {
    const matches = data?.matches ?? [];
    if (matches.length === 0) return [];

    return matches.filter((match) => {
      const job = match.jobPosting;

      // Keyword search
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          job.title.toLowerCase().includes(searchLower) ||
          job.company.toLowerCase().includes(searchLower) ||
          job.description.toLowerCase().includes(searchLower) ||
          job.skills.some((s) => s.toLowerCase().includes(searchLower));

        if (!matchesSearch) return false;
      }

      // Job type
      if (filters.jobType && job.type !== filters.jobType) {
        return false;
      }

      // Industry
      if (filters.industry && job.industry !== filters.industry) {
        return false;
      }

      // Source
      if (filters.source) {
        const jobSource = job.externalSource ?? "manual";
        if (jobSource !== filters.source) return false;
      }

      // Min score
      if (filters.minScore > 0 && match.matchScore < filters.minScore) {
        return false;
      }

      return true;
    });
  }, [data?.matches, filters]);

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
  /*  Matches list with filters                                        */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
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
          {matching ? "Matching..." : "Refresh Matches"}
        </Button>
      </div>

      {!canRefresh && !matching && (
        <p className="text-xs text-gray-400">
          Job matching can be refreshed once every 24 hours
        </p>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Filter Panel */}
      {matches.length > 0 && (
        <FilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          matchCount={matches.length}
          filteredCount={filteredMatches.length}
        />
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

      {/* No results after filtering */}
      {filteredMatches.length === 0 && matches.length > 0 && !matching && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-sm text-gray-500 mb-2">
            No matches found with the current filters.
          </p>
          <button
            onClick={() => setFilters(INITIAL_FILTERS)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Match cards */}
      <div className="space-y-4">
        {filteredMatches.map((match) => (
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">
                      {match.jobPosting.title}
                    </h3>
                    <SourceBadge source={match.jobPosting.externalSource} />
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full border ${scoreBg(match.matchScore)}`}
                    >
                      <span className={scoreColor(match.matchScore)}>
                        {match.matchScore}% Match
                      </span>
                    </span>
                    {match.jobPosting.externalUrl && (
                      <a
                        href={match.jobPosting.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
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
                  {match.jobPosting.industry && (
                    <span className="text-gray-400">
                      {match.jobPosting.industry}
                    </span>
                  )}
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
                  {match.jobPosting.skills.slice(0, 8).map((skill) => (
                    <span
                      key={skill}
                      className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                  {match.jobPosting.skills.length > 8 && (
                    <span className="text-xs text-gray-400">
                      +{match.jobPosting.skills.length - 8} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
