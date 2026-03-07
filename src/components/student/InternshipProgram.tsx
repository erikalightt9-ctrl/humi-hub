"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  MapPin,
  Building2,
  Send,
  X,
  CheckCircle2,
  Clock,
  Eye,
  Star,
  ThumbsUp,
  XCircle,
  MinusCircle,
  FileText,
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
  readonly isInternship: boolean;
  readonly _count: { readonly applications: number };
}

interface JobApplicationPosting {
  readonly id: string;
  readonly title: string;
  readonly company: string;
  readonly location: string;
  readonly type: string;
  readonly salaryRange: string | null;
  readonly isInternship: boolean;
  readonly skills: ReadonlyArray<string>;
}

interface JobApplication {
  readonly id: string;
  readonly studentId: string;
  readonly jobPostingId: string;
  readonly coverLetter: string;
  readonly status: string;
  readonly adminNotes: string | null;
  readonly appliedAt: string;
  readonly updatedAt: string;
  readonly jobPosting: JobApplicationPosting;
}

interface InternshipData {
  readonly listings: ReadonlyArray<JobPosting>;
  readonly applications: ReadonlyArray<JobApplication>;
}

/* ------------------------------------------------------------------ */
/*  Status badge helper                                                */
/* ------------------------------------------------------------------ */

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  REVIEWED: "bg-blue-100 text-blue-800",
  SHORTLISTED: "bg-purple-100 text-purple-800",
  ACCEPTED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  WITHDRAWN: "bg-gray-100 text-gray-600",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  PENDING: <Clock className="h-3 w-3" />,
  REVIEWED: <Eye className="h-3 w-3" />,
  SHORTLISTED: <Star className="h-3 w-3" />,
  ACCEPTED: <ThumbsUp className="h-3 w-3" />,
  REJECTED: <XCircle className="h-3 w-3" />,
  WITHDRAWN: <MinusCircle className="h-3 w-3" />,
};

function StatusBadge({ status }: { readonly status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600"}`}
    >
      {STATUS_ICONS[status]}
      {status}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Loading skeleton                                                   */
/* ------------------------------------------------------------------ */

function ListingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse"
        >
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-4" />
          <div className="h-16 bg-gray-100 rounded mb-4" />
          <div className="flex gap-2 mb-3">
            <div className="h-5 bg-gray-200 rounded-full w-16" />
            <div className="h-5 bg-gray-200 rounded-full w-20" />
          </div>
          <div className="h-9 bg-gray-200 rounded w-24" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function InternshipProgram() {
  const [data, setData] = useState<InternshipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"listings" | "applications">("listings");

  // Modal state
  const [applyingTo, setApplyingTo] = useState<JobPosting | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /* ---------------------------------------------------------------- */
  /*  Fetch data                                                       */
  /* ---------------------------------------------------------------- */

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/student/internship-program");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error ?? "Failed to load internships");
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
  /*  Apply handler                                                    */
  /* ---------------------------------------------------------------- */

  const handleApply = useCallback(async () => {
    if (!applyingTo) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/student/internship-program", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobPostingId: applyingTo.id,
          coverLetter,
        }),
      });

      const json = await res.json();

      if (json.success) {
        setSuccessMessage(`Successfully applied to ${applyingTo.title}!`);
        setApplyingTo(null);
        setCoverLetter("");
        // Re-fetch data to update applied status
        setLoading(true);
        fetchData();
        // Clear success after 4 seconds
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setSubmitError(json.error ?? "Failed to submit application");
      }
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [applyingTo, coverLetter, fetchData]);

  /* ---------------------------------------------------------------- */
  /*  Helpers                                                          */
  /* ---------------------------------------------------------------- */

  const appliedJobIds = new Set(
    data?.applications.map((app) => app.jobPostingId) ?? [],
  );

  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trimEnd() + "...";
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  /* ---------------------------------------------------------------- */
  /*  Loading state                                                    */
  /* ---------------------------------------------------------------- */

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2 mb-4">
          <div className="h-9 bg-gray-200 rounded-lg w-40 animate-pulse" />
          <div className="h-9 bg-gray-200 rounded-lg w-40 animate-pulse" />
        </div>
        <ListingSkeleton />
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Error state                                                      */
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

  const listings = data?.listings ?? [];
  const applications = data?.applications ?? [];

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-4">
      {/* Success toast */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("listings")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "listings"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Available Internships
          {listings.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-white/20">
              {listings.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("applications")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "applications"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          My Applications
          {applications.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-white/20">
              {applications.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab content: Available Internships */}
      {activeTab === "listings" && (
        <>
          {listings.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                No Internships Available
              </h2>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                There are no internship openings at the moment. Check back soon
                for new opportunities!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {listings.map((listing) => {
                const isApplied = appliedJobIds.has(listing.id);

                return (
                  <div
                    key={listing.id}
                    className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col"
                  >
                    {/* Title and company */}
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {listing.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {listing.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {listing.location}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                      {truncateText(listing.description, 150)}
                    </p>

                    {/* Requirements tags */}
                    {listing.requirements.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-gray-500 mb-1">
                          Requirements
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {listing.requirements.slice(0, 4).map((req) => (
                            <span
                              key={req}
                              className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full"
                            >
                              {req}
                            </span>
                          ))}
                          {listing.requirements.length > 4 && (
                            <span className="text-xs text-gray-400">
                              +{listing.requirements.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Skills tags */}
                    {listing.skills.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-medium text-gray-500 mb-1">
                          Skills
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {listing.skills.map((skill) => (
                            <span
                              key={skill}
                              className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Apply / Applied */}
                    <div className="mt-auto pt-2">
                      {isApplied ? (
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          Applied
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          className="gap-1.5"
                          onClick={() => {
                            setApplyingTo(listing);
                            setCoverLetter("");
                            setSubmitError(null);
                          }}
                        >
                          <Send className="h-3.5 w-3.5" />
                          Apply
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Tab content: My Applications */}
      {activeTab === "applications" && (
        <>
          {applications.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
              <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                No Applications Yet
              </h2>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                You haven&apos;t applied to any internships yet. Browse the
                available internships and start applying!
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setActiveTab("listings")}
              >
                Browse Internships
              </Button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="p-4 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-gray-900 text-sm">
                      {app.jobPosting.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {app.jobPosting.company}
                      </span>
                      <span>{formatDate(app.appliedAt)}</span>
                    </div>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Application modal */}
      {applyingTo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Apply to Internship
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {applyingTo.title} at {applyingTo.company}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setApplyingTo(null);
                    setCoverLetter("");
                    setSubmitError(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Cover letter */}
              <div className="mb-4">
                <label
                  htmlFor="cover-letter"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Cover Letter
                </label>
                <textarea
                  id="cover-letter"
                  rows={8}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Tell the employer why you're a great fit for this internship... (minimum 50 characters)"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">
                  {coverLetter.length}/5000 characters (minimum 50)
                </p>
              </div>

              {/* Error */}
              {submitError && (
                <p className="text-sm text-red-500 mb-4">{submitError}</p>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setApplyingTo(null);
                    setCoverLetter("");
                    setSubmitError(null);
                  }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={handleApply}
                  disabled={submitting || coverLetter.length < 50}
                >
                  {submitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  {submitting ? "Submitting..." : "Submit Application"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
