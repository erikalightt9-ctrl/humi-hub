"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Briefcase, X } from "lucide-react";

interface JobPosting {
  readonly id: string;
  readonly title: string;
  readonly company: string;
  readonly location: string;
  readonly type: string;
  readonly description: string;
  readonly skills: readonly string[];
}

interface ApiJobsResponse {
  readonly success: boolean;
  readonly data: { readonly jobs: JobPosting[] } | null;
  readonly error: string | null;
}

interface ApplyModalProps {
  readonly job: JobPosting;
  readonly onClose: () => void;
}

function ApplyModal({ job, onClose }: ApplyModalProps) {
  const [coverLetter, setCoverLetter] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/placement/jobs/apply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId: job.id, coverLetter: coverLetter.trim() }),
        });
        const json = await res.json();

        if (!res.ok || !json.success) {
          setError(json.error ?? "Application failed. Please try again.");
          return;
        }
        setSuccess(true);
      } catch {
        setError("Network error. Please check your connection and try again.");
      } finally {
        setLoading(false);
      }
    },
    [job.id, coverLetter]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{job.title}</h2>
            <p className="text-sm text-gray-500">{job.company}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          {success ? (
            <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-4 text-green-800 text-sm font-medium text-center">
              Application submitted! The employer will review your profile and reach out to you.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
                  {error}
                </div>
              )}
              <div className="flex flex-col gap-1">
                <label htmlFor="coverLetter" className="text-sm font-medium text-gray-700">
                  Cover Letter <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  id="coverLetter"
                  rows={5}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Introduce yourself and explain why you're a great fit for this role..."
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Submitting..." : "Submit Application"}
                </Button>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {success && (
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function JobMatchBoard() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchJobs = useCallback(async (searchTerm: string) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.set("search", searchTerm.trim());

      const res = await fetch(`/api/placement/jobs?${params.toString()}`);
      const json: ApiJobsResponse = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error ?? "Failed to load jobs.");
        return;
      }

      setJobs(json.data?.jobs ?? []);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs("");
  }, [fetchJobs]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearch(value);
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => {
        fetchJobs(value);
      }, 400);
    },
    [fetchJobs]
  );

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by title, company, or skills..."
          className="w-full rounded-xl border border-gray-300 bg-white pl-10 pr-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && jobs.length === 0 && (
        <div className="text-center py-16 text-gray-500 text-sm">
          No job listings found{search ? ` for "${search}"` : ""}. Check back soon!
        </div>
      )}

      {!loading && !error && jobs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-3 hover:shadow-md transition-shadow duration-200"
            >
              <div>
                <h3 className="text-base font-semibold text-gray-900">{job.title}</h3>
                <p className="text-sm font-medium text-blue-600 mt-0.5">{job.company}</p>
              </div>

              <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {job.location}
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" /> {job.type}
                </span>
              </div>

              <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                {job.description}
              </p>

              {job.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {job.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-block rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs px-2.5 py-0.5 font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-auto pt-1">
                <Button
                  size="sm"
                  onClick={() => setSelectedJob(job)}
                  className="w-full"
                >
                  Apply Now
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedJob && (
        <ApplyModal job={selectedJob} onClose={() => setSelectedJob(null)} />
      )}
    </div>
  );
}
