"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Search, Building2, MapPin, Clock, Briefcase, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface JobPosting {
  readonly id: string;
  readonly title: string;
  readonly company: string;
  readonly description: string;
  readonly requirements: readonly string[];
  readonly skills: readonly string[];
  readonly courseSlug: string | null;
  readonly location: string;
  readonly type: string;
  readonly salaryRange: string | null;
  readonly createdAt: string;
}

interface ApiResponse {
  readonly success: boolean;
  readonly data: readonly JobPosting[] | null;
  readonly error: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COURSE_OPTIONS = [
  { value: "MEDICAL_VA", label: "Medical VA" },
  { value: "REAL_ESTATE_VA", label: "Real Estate VA" },
  { value: "US_BOOKKEEPING_VA", label: "US Bookkeeping VA" },
] as const;

const TYPE_OPTIONS = [
  { value: "full-time", label: "Full-Time" },
  { value: "part-time", label: "Part-Time" },
  { value: "freelance", label: "Freelance" },
  { value: "contract", label: "Contract" },
] as const;

const DEBOUNCE_MS = 300;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRelativeTimeLabel(dateString: string): string {
  const now = new Date();
  const posted = new Date(dateString);
  const diffMs = now.getTime() - posted.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return "Just posted";
  }
  if (diffDays === 0) {
    return "Posted today";
  }
  if (diffDays === 1) {
    return "Posted 1 day ago";
  }
  if (diffDays < 30) {
    return `Posted ${diffDays} days ago`;
  }
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) {
    return "Posted 1 month ago";
  }
  return `Posted ${diffMonths} months ago`;
}

function buildQueryString(
  search: string,
  courseFilter: string,
  typeFilter: string,
): string {
  const params = new URLSearchParams();
  if (search.trim()) {
    params.set("search", search.trim());
  }
  if (courseFilter) {
    params.set("courseSlug", courseFilter);
  }
  if (typeFilter) {
    params.set("type", typeFilter);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function JobBoard() {
  const [jobs, setJobs] = useState<readonly JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchJobs = useCallback(
    async (searchValue: string, course: string, type: string) => {
      setLoading(true);
      setError(null);

      try {
        const qs = buildQueryString(searchValue, course, type);
        const res = await fetch(`/api/jobs${qs}`);
        const json: ApiResponse = await res.json();

        if (!json.success) {
          setError(json.error ?? "Failed to load jobs");
          setJobs([]);
          return;
        }

        setJobs(json.data ?? []);
      } catch {
        setError("Unable to load jobs. Please try again.");
        setJobs([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Re-fetch when filters change (non-search)
  useEffect(() => {
    fetchJobs(search, courseFilter, typeFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseFilter, typeFilter]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchJobs(search, courseFilter, typeFilter);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  const handleCourseChange = (value: string) => {
    setCourseFilter(value === "ALL" ? "" : value);
  };

  const handleTypeChange = (value: string) => {
    setTypeFilter(value === "ALL" ? "" : value);
  };

  return (
    <div>
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by title, company, or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Course Filter */}
        <Select
          value={courseFilter || "ALL"}
          onValueChange={handleCourseChange}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Courses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Courses</SelectItem>
            {COURSE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Type Filter */}
        <Select
          value={typeFilter || "ALL"}
          onValueChange={handleTypeChange}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            {TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results Count */}
      {!loading && !error && (
        <p className="text-sm text-gray-500 mb-6">
          Showing {jobs.length} {jobs.length === 1 ? "job" : "jobs"}
        </p>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
          <span className="text-gray-500">Loading jobs...</span>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="text-center py-20">
          <p className="text-red-600 font-medium">{error}</p>
          <button
            type="button"
            onClick={() => fetchJobs(search, courseFilter, typeFilter)}
            className="mt-4 text-sm text-blue-600 hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && jobs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Briefcase className="h-12 w-12 mb-4" />
          <p className="text-lg font-medium text-gray-500">No jobs found</p>
          <p className="text-sm text-gray-400 mt-1">
            Try adjusting your search or filters.
          </p>
        </div>
      )}

      {/* Job Cards Grid */}
      {!loading && !error && jobs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {job.title}
              </h3>

              {/* Meta */}
              <div className="space-y-1 mb-3">
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Building2 className="h-4 w-4 shrink-0" />
                  <span>{job.company}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>{job.location}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span className="capitalize">{job.type}</span>
                </div>
              </div>

              {/* Salary Badge */}
              {job.salaryRange && (
                <span className="inline-block bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium mb-3">
                  {job.salaryRange}
                </span>
              )}

              {/* Description Snippet */}
              <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                {job.description}
              </p>

              {/* Skills Tags */}
              {job.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {job.skills.map((skill) => (
                    <span
                      key={skill}
                      className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {/* Posted Date */}
              <p className="text-xs text-gray-400">
                {getRelativeTimeLabel(job.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
