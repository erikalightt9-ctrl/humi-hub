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
  DollarSign,
  UserCircle,
  Rocket,
  MessageSquare,
  Gauge,
  Award,
  Heart,
  Lightbulb,
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

interface FreelanceData {
  readonly listings: ReadonlyArray<JobPosting>;
  readonly applications: ReadonlyArray<JobApplication>;
  readonly studentName: string;
  readonly courseTitle: string;
}

/* ------------------------------------------------------------------ */
/*  Status badge                                                       */
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
/*  Tips data                                                          */
/* ------------------------------------------------------------------ */

interface FreelanceTip {
  readonly icon: React.ReactNode;
  readonly title: string;
  readonly description: string;
}

const FREELANCE_TIPS: ReadonlyArray<FreelanceTip> = [
  {
    icon: <UserCircle className="h-6 w-6 text-blue-600" />,
    title: "Build Your Profile",
    description: "Complete your portfolio and verify your skills",
  },
  {
    icon: <Rocket className="h-6 w-6 text-green-600" />,
    title: "Start Small",
    description: "Take on smaller projects to build reviews",
  },
  {
    icon: <Gauge className="h-6 w-6 text-purple-600" />,
    title: "Set Your Rates",
    description: "Research market rates for your specialization",
  },
  {
    icon: <MessageSquare className="h-6 w-6 text-orange-600" />,
    title: "Communicate Promptly",
    description: "Respond to clients within 24 hours",
  },
  {
    icon: <Award className="h-6 w-6 text-indigo-600" />,
    title: "Deliver Quality",
    description: "Always exceed expectations on deliverables",
  },
  {
    icon: <Heart className="h-6 w-6 text-pink-600" />,
    title: "Get Testimonials",
    description: "Ask satisfied clients for recommendations",
  },
];

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
          <div className="h-6 bg-green-100 rounded w-28 mb-3" />
          <div className="h-16 bg-gray-100 rounded mb-4" />
          <div className="h-9 bg-gray-200 rounded w-28" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Cover letter template generator                                    */
/* ------------------------------------------------------------------ */

function generateCoverLetterTemplate(
  studentName: string,
  courseTitle: string,
  jobTitle: string,
  jobSkills: ReadonlyArray<string>,
): string {
  const skillsText =
    jobSkills.length > 0 ? jobSkills.join(", ") : "virtual assistance";
  return `Hi, I'm ${studentName}, a trained Virtual Assistant specializing in ${courseTitle}. I'm interested in this ${jobTitle} opportunity and would love to contribute my skills in ${skillsText}. I have completed my VA training and am ready to deliver quality work.`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function FreelanceOpportunities() {
  const [data, setData] = useState<FreelanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      const res = await fetch("/api/student/freelance");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error ?? "Failed to load freelance opportunities");
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
  /*  Open modal with pre-filled template                              */
  /* ---------------------------------------------------------------- */

  const openApplyModal = useCallback(
    (listing: JobPosting) => {
      const template = generateCoverLetterTemplate(
        data?.studentName ?? "",
        data?.courseTitle ?? "",
        listing.title,
        listing.skills,
      );
      setApplyingTo(listing);
      setCoverLetter(template);
      setSubmitError(null);
    },
    [data?.studentName, data?.courseTitle],
  );

  /* ---------------------------------------------------------------- */
  /*  Apply handler                                                    */
  /* ---------------------------------------------------------------- */

  const handleApply = useCallback(async () => {
    if (!applyingTo) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/student/freelance", {
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
        setLoading(true);
        fetchData();
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
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
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
    <div className="space-y-8">
      {/* Success toast */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}

      {/* Section 1: Tips Banner */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          <h2 className="text-lg font-semibold text-gray-900">
            Getting Started as a Freelance VA
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FREELANCE_TIPS.map((tip) => (
            <div
              key={tip.title}
              className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3"
            >
              <div className="bg-gray-50 rounded-lg p-2 shrink-0">
                {tip.icon}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {tip.title}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {tip.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Available Freelance Gigs */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Available Freelance Gigs
          {listings.length > 0 && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({listings.length} available)
            </span>
          )}
        </h2>

        {listings.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Freelance Gigs Available
            </h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              There are no freelance opportunities at the moment. Check back
              soon for new gigs!
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
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-2">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {listing.company}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {listing.location}
                    </span>
                  </div>

                  {/* Salary range */}
                  {listing.salaryRange && (
                    <div className="flex items-center gap-1.5 mb-3">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-semibold text-green-700">
                        {listing.salaryRange}
                      </span>
                    </div>
                  )}

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

                  {/* Quick Apply / Applied */}
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
                        onClick={() => openApplyModal(listing)}
                      >
                        <Send className="h-3.5 w-3.5" />
                        Quick Apply
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 3: My Applications */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          My Applications
          {applications.length > 0 && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({applications.length})
            </span>
          )}
        </h2>

        {applications.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
            <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Applications Yet
            </h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              You haven&apos;t applied to any freelance gigs yet. Browse the
              available gigs above and start applying!
            </p>
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
                    {app.jobPosting.salaryRange && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {app.jobPosting.salaryRange}
                      </span>
                    )}
                    <span>{formatDate(app.appliedAt)}</span>
                  </div>
                </div>
                <StatusBadge status={app.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Application modal */}
      {applyingTo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Quick Apply
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {applyingTo.title} at {applyingTo.company}
                  </p>
                  {applyingTo.salaryRange && (
                    <p className="text-sm font-medium text-green-600 mt-1 flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5" />
                      {applyingTo.salaryRange}
                    </p>
                  )}
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

              {/* Cover letter with pre-filled template */}
              <div className="mb-4">
                <label
                  htmlFor="cover-letter-freelance"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Cover Letter
                </label>
                <p className="text-xs text-gray-400 mb-2">
                  We&apos;ve pre-filled a template for you. Feel free to edit it
                  before submitting.
                </p>
                <textarea
                  id="cover-letter-freelance"
                  rows={8}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
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
