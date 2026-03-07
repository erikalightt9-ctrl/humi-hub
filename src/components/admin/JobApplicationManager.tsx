"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  Building2,
  X,
  CheckCircle2,
  Clock,
  Eye,
  Star,
  ThumbsUp,
  XCircle,
  Filter,
  ChevronDown,
  Mail,
  User,
  GraduationCap,
  ExternalLink,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CareerScore {
  readonly overallScore: number;
  readonly communication: number;
  readonly accuracy: number;
  readonly speed: number;
  readonly reliability: number;
  readonly technicalSkills: number;
  readonly professionalism: number;
  readonly aiSummary: string;
  readonly evaluatedAt: string;
}

interface ApplicationStudent {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly portfolioPublic: boolean;
  readonly enrollment: {
    readonly course: {
      readonly title: string;
      readonly slug: string;
    };
  };
  readonly careerScores: ReadonlyArray<CareerScore>;
}

interface ApplicationJobPosting {
  readonly id: string;
  readonly title: string;
  readonly company: string;
  readonly location: string;
  readonly type: string;
  readonly salaryRange: string | null;
  readonly isInternship: boolean;
  readonly skills: ReadonlyArray<string>;
  readonly requirements: ReadonlyArray<string>;
}

interface Application {
  readonly id: string;
  readonly studentId: string;
  readonly jobPostingId: string;
  readonly coverLetter: string;
  readonly status: string;
  readonly adminNotes: string | null;
  readonly appliedAt: string;
  readonly updatedAt: string;
  readonly student: ApplicationStudent;
  readonly jobPosting: ApplicationJobPosting;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUS_OPTIONS = ["ALL", "PENDING", "REVIEWED", "SHORTLISTED", "ACCEPTED", "REJECTED"] as const;

const COURSE_OPTIONS = [
  { value: "ALL", label: "All Courses" },
  { value: "MEDICAL_VA", label: "Medical VA" },
  { value: "REAL_ESTATE_VA", label: "Real Estate VA" },
  { value: "US_BOOKKEEPING_VA", label: "US Bookkeeping VA" },
] as const;

const ADMIN_STATUS_OPTIONS = ["PENDING", "REVIEWED", "SHORTLISTED", "ACCEPTED", "REJECTED"] as const;

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
/*  Score bar component                                                */
/* ------------------------------------------------------------------ */

function ScoreBar({
  label,
  value,
}: {
  readonly label: string;
  readonly value: number;
}) {
  const barColor =
    value >= 75
      ? "bg-green-500"
      : value >= 50
        ? "bg-yellow-500"
        : "bg-orange-500";

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-600 w-28 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${barColor} transition-all`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-700 w-8 text-right">
        {value}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function JobApplicationManager() {
  const [applications, setApplications] = useState<ReadonlyArray<Application>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [courseFilter, setCourseFilter] = useState("ALL");

  // Detail panel
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /* ---------------------------------------------------------------- */
  /*  Fetch applications                                               */
  /* ---------------------------------------------------------------- */

  const fetchApplications = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (courseFilter !== "ALL") params.set("courseSlug", courseFilter);

      const url = `/api/admin/job-applications${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url);
      const json = await res.json();

      if (json.success) {
        setApplications(json.data);
      } else {
        setError(json.error ?? "Failed to load applications");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, courseFilter]);

  useEffect(() => {
    setLoading(true);
    fetchApplications();
  }, [fetchApplications]);

  /* ---------------------------------------------------------------- */
  /*  Open detail panel                                                */
  /* ---------------------------------------------------------------- */

  const openDetail = useCallback((app: Application) => {
    setSelectedApp(app);
    setEditStatus(app.status);
    setEditNotes(app.adminNotes ?? "");
    setUpdateError(null);
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Update application status                                        */
  /* ---------------------------------------------------------------- */

  const handleUpdate = useCallback(async () => {
    if (!selectedApp) return;

    setUpdating(true);
    setUpdateError(null);

    try {
      const res = await fetch("/api/admin/job-applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: selectedApp.id,
          status: editStatus,
          adminNotes: editNotes || undefined,
        }),
      });

      const json = await res.json();

      if (json.success) {
        setSuccessMessage("Application updated successfully");
        setSelectedApp(null);
        setLoading(true);
        fetchApplications();
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setUpdateError(json.error ?? "Failed to update application");
      }
    } catch {
      setUpdateError("Network error. Please try again.");
    } finally {
      setUpdating(false);
    }
  }, [selectedApp, editStatus, editNotes, fetchApplications]);

  /* ---------------------------------------------------------------- */
  /*  Helpers                                                          */
  /* ---------------------------------------------------------------- */

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

  if (loading && applications.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="h-9 bg-gray-200 rounded-lg w-40 animate-pulse" />
          <div className="h-9 bg-gray-200 rounded-lg w-40 animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
                <div className="h-6 bg-gray-200 rounded-full w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Error state                                                      */
  /* ---------------------------------------------------------------- */

  if (error && applications.length === 0) {
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
            fetchApplications();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

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

      {/* Count and filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Filter className="h-4 w-4" />
          <span>
            {applications.length} application
            {applications.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex gap-2 ml-auto">
          {/* Status filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === "ALL" ? "All Statuses" : opt}
                </option>
              ))}
            </select>
            <ChevronDown className="h-4 w-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Course filter */}
          <div className="relative">
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {COURSE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="h-4 w-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Loading overlay for refetching */}
      {loading && applications.length > 0 && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
        </div>
      )}

      {/* Empty state */}
      {!loading && applications.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            No Applications Found
          </h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            {statusFilter !== "ALL" || courseFilter !== "ALL"
              ? "No applications match the selected filters. Try adjusting your filters."
              : "No job applications have been submitted yet."}
          </p>
        </div>
      )}

      {/* Application list */}
      {!loading && applications.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {applications.map((app) => (
            <div
              key={app.id}
              className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => openDetail(app)}
            >
              <div className="flex items-center gap-4">
                {/* Avatar placeholder */}
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-blue-600" />
                </div>

                {/* Student info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900 text-sm truncate">
                      {app.student.name}
                    </h4>
                    <span className="text-xs text-gray-400 hidden sm:inline">
                      {app.student.email}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {app.jobPosting.title} - {app.jobPosting.company}
                    </span>
                    <span className="hidden sm:inline">
                      {formatDate(app.appliedAt)}
                    </span>
                  </div>
                </div>

                {/* Type badge */}
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 hidden md:inline-flex">
                  {app.jobPosting.isInternship ? "Internship" : app.jobPosting.type}
                </span>

                {/* Status */}
                <StatusBadge status={app.status} />

                {/* View button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex gap-1.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    openDetail(app);
                  }}
                >
                  <Eye className="h-3.5 w-3.5" />
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Application Details
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {selectedApp.jobPosting.title} at{" "}
                    {selectedApp.jobPosting.company}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedApp(null);
                    setUpdateError(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Student info section */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  Student Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span>{" "}
                    <span className="font-medium text-gray-900">
                      {selectedApp.student.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>{" "}
                    <span className="font-medium text-gray-900 flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {selectedApp.student.email}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Course:</span>{" "}
                    <span className="font-medium text-gray-900 flex items-center gap-1">
                      <GraduationCap className="h-3 w-3" />
                      {selectedApp.student.enrollment.course.title}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Applied:</span>{" "}
                    <span className="font-medium text-gray-900">
                      {formatDate(selectedApp.appliedAt)}
                    </span>
                  </div>
                  {selectedApp.student.portfolioPublic && (
                    <div className="sm:col-span-2">
                      <a
                        href={`/portfolio/${selectedApp.student.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View Portfolio
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Cover letter */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <FileText className="h-4 w-4" />
                  Cover Letter
                </h4>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {selectedApp.coverLetter}
                  </p>
                </div>
              </div>

              {/* Career readiness score */}
              {selectedApp.student.careerScores.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                    <Star className="h-4 w-4" />
                    Career Readiness Score
                  </h4>
                  <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
                    {(() => {
                      const score = selectedApp.student.careerScores[0];
                      return (
                        <>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-2xl font-bold text-gray-900">
                              {score.overallScore}
                              <span className="text-sm font-normal text-gray-500">
                                /100
                              </span>
                            </span>
                            <span className="text-xs text-gray-400">
                              Evaluated {formatDate(score.evaluatedAt)}
                            </span>
                          </div>
                          <ScoreBar
                            label="Communication"
                            value={score.communication}
                          />
                          <ScoreBar label="Accuracy" value={score.accuracy} />
                          <ScoreBar label="Speed" value={score.speed} />
                          <ScoreBar
                            label="Reliability"
                            value={score.reliability}
                          />
                          <ScoreBar
                            label="Technical"
                            value={score.technicalSkills}
                          />
                          <ScoreBar
                            label="Professionalism"
                            value={score.professionalism}
                          />
                          {score.aiSummary && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <p className="text-xs text-gray-500 italic">
                                {score.aiSummary}
                              </p>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Status update section */}
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-semibold text-blue-800 mb-3">
                  Update Application
                </h4>

                {/* Status dropdown */}
                <div className="mb-3">
                  <label
                    htmlFor="app-status"
                    className="block text-xs font-medium text-blue-700 mb-1"
                  >
                    Status
                  </label>
                  <div className="relative">
                    <select
                      id="app-status"
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="appearance-none w-full bg-white border border-blue-200 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {ADMIN_STATUS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="h-4 w-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Admin notes */}
                <div className="mb-3">
                  <label
                    htmlFor="admin-notes"
                    className="block text-xs font-medium text-blue-700 mb-1"
                  >
                    Admin Notes
                  </label>
                  <textarea
                    id="admin-notes"
                    rows={3}
                    className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Add notes about this application..."
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                  />
                  <p className="text-xs text-blue-400 mt-1">
                    {editNotes.length}/2000 characters
                  </p>
                </div>

                {/* Error */}
                {updateError && (
                  <p className="text-sm text-red-500 mb-3">{updateError}</p>
                )}

                {/* Update button */}
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={handleUpdate}
                  disabled={updating}
                >
                  {updating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  {updating ? "Updating..." : "Update Application"}
                </Button>
              </div>

              {/* Close */}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedApp(null);
                    setUpdateError(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
