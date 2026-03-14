"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Loader2,
  MapPin,
  Building2,
  Briefcase,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  readonly externalId: string | null;
  readonly externalSource: string | null;
  readonly externalUrl: string | null;
  readonly createdAt: string;
}

interface SyncSourceResult {
  readonly synced: number;
  readonly skipped: number;
  readonly errors: number;
}

interface SyncResult {
  readonly remotive: SyncSourceResult;
  readonly jsearch: SyncSourceResult;
  readonly total: SyncSourceResult;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const JOB_TYPES = [
  { value: "full-time", label: "Full-Time" },
  { value: "part-time", label: "Part-Time" },
  { value: "freelance", label: "Freelance" },
  { value: "contract", label: "Contract" },
] as const;

const COURSE_OPTIONS = [
  { value: "", label: "Any VA Background" },
  { value: "MEDICAL_VA", label: "Medical VA" },
  { value: "REAL_ESTATE_VA", label: "Real Estate VA" },
  { value: "US_BOOKKEEPING_VA", label: "US Bookkeeping VA" },
] as const;

const INITIAL_FORM_STATE: {
  readonly title: string;
  readonly company: string;
  readonly description: string;
  readonly requirementsText: string;
  readonly skillsText: string;
  readonly courseSlug: string;
  readonly location: string;
  readonly type: string;
  readonly salaryRange: string;
} = {
  title: "",
  company: "",
  description: "",
  requirementsText: "",
  skillsText: "",
  courseSlug: "",
  location: "",
  type: "full-time",
  salaryRange: "",
};

const SOURCE_LABELS: Readonly<Record<string, string>> = {
  remotive: "Remotive",
  jsearch: "JSearch",
  manual: "Manual",
};

const SOURCE_COLORS: Readonly<Record<string, string>> = {
  remotive: "bg-purple-100 text-purple-700",
  jsearch: "bg-teal-100 text-teal-700",
  manual: "bg-gray-100 text-gray-600",
};

/* ------------------------------------------------------------------ */
/*  Course slug display label                                          */
/* ------------------------------------------------------------------ */

function courseLabel(slug: string | null): string {
  const found = COURSE_OPTIONS.find((c) => c.value === slug);
  return found?.label ?? "Any VA Background";
}

/* ------------------------------------------------------------------ */
/*  Source badge                                                        */
/* ------------------------------------------------------------------ */

function SourceBadge({ source }: { readonly source: string | null }) {
  const key = source ?? "manual";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${SOURCE_COLORS[key] ?? SOURCE_COLORS.manual}`}
    >
      {SOURCE_LABELS[key] ?? "Manual"}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Sync Modal                                                         */
/* ------------------------------------------------------------------ */

function SyncModal({
  onClose,
  onComplete,
}: {
  readonly onClose: () => void;
  readonly onComplete: () => void;
}) {
  const [syncing, setSyncing] = useState(false);
  const [syncSource, setSyncSource] = useState<"all" | "remotive" | "jsearch">(
    "all",
  );
  const [result, setResult] = useState<SyncResult | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  async function handleSync() {
    setSyncing(true);
    setSyncError(null);
    setResult(null);

    try {
      const res = await fetch("/api/admin/job-postings/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: syncSource }),
      });

      const json = await res.json();

      if (!json.success) {
        setSyncError(json.error ?? "Sync failed");
        return;
      }

      setResult(json.data);
      onComplete();
    } catch {
      setSyncError("Network error. Please try again.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Sync External Jobs</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} disabled={syncing}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Import job listings from external job boards. Duplicates are
        automatically skipped.
      </p>

      {/* Source selection */}
      <div className="mb-4">
        <Label className="mb-2 block">Source</Label>
        <div className="flex gap-2 flex-wrap">
          {(
            [
              { value: "all", label: "All Sources" },
              { value: "remotive", label: "Remotive" },
              { value: "jsearch", label: "JSearch (RapidAPI)" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSyncSource(opt.value)}
              disabled={syncing}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                syncSource === opt.value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {syncError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {syncError}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-800">Sync Complete</span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-white rounded-lg p-2">
              <div className="text-xl font-bold text-green-600">
                {result.total.synced}
              </div>
              <div className="text-xs text-gray-500">New Jobs</div>
            </div>
            <div className="bg-white rounded-lg p-2">
              <div className="text-xl font-bold text-gray-500">
                {result.total.skipped}
              </div>
              <div className="text-xs text-gray-500">Duplicates</div>
            </div>
            <div className="bg-white rounded-lg p-2">
              <div className="text-xl font-bold text-red-500">
                {result.total.errors}
              </div>
              <div className="text-xs text-gray-500">Errors</div>
            </div>
          </div>

          {/* Per-source breakdown */}
          {syncSource === "all" && (
            <div className="mt-3 text-xs text-gray-500 space-y-1">
              <div className="flex justify-between">
                <span>Remotive:</span>
                <span>
                  {result.remotive.synced} new, {result.remotive.skipped}{" "}
                  skipped
                </span>
              </div>
              <div className="flex justify-between">
                <span>JSearch:</span>
                <span>
                  {result.jsearch.synced} new, {result.jsearch.skipped} skipped
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        {result ? (
          <Button onClick={onClose}>Done</Button>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={syncing}
            >
              Cancel
            </Button>
            <Button onClick={handleSync} disabled={syncing} className="gap-2">
              {syncing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Start Sync
                </>
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function JobPostingManager() {
  const [postings, setPostings] = useState<ReadonlyArray<JobPosting>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [title, setTitle] = useState(INITIAL_FORM_STATE.title);
  const [company, setCompany] = useState(INITIAL_FORM_STATE.company);
  const [description, setDescription] = useState(
    INITIAL_FORM_STATE.description,
  );
  const [requirementsText, setRequirementsText] = useState(
    INITIAL_FORM_STATE.requirementsText,
  );
  const [skillsText, setSkillsText] = useState(INITIAL_FORM_STATE.skillsText);
  const [courseSlug, setCourseSlug] = useState(INITIAL_FORM_STATE.courseSlug);
  const [location, setLocation] = useState(INITIAL_FORM_STATE.location);
  const [jobType, setJobType] = useState(INITIAL_FORM_STATE.type);
  const [salaryRange, setSalaryRange] = useState(
    INITIAL_FORM_STATE.salaryRange,
  );

  /* ---------------------------------------------------------------- */
  /*  Fetch postings                                                   */
  /* ---------------------------------------------------------------- */

  const fetchPostings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/job-postings");
      const json = await res.json();
      if (json.success) {
        setPostings(json.data);
      } else {
        setError(json.error ?? "Failed to load job postings");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPostings();
  }, [fetchPostings]);

  /* ---------------------------------------------------------------- */
  /*  Form helpers                                                     */
  /* ---------------------------------------------------------------- */

  function resetForm() {
    setTitle(INITIAL_FORM_STATE.title);
    setCompany(INITIAL_FORM_STATE.company);
    setDescription(INITIAL_FORM_STATE.description);
    setRequirementsText(INITIAL_FORM_STATE.requirementsText);
    setSkillsText(INITIAL_FORM_STATE.skillsText);
    setCourseSlug(INITIAL_FORM_STATE.courseSlug);
    setLocation(INITIAL_FORM_STATE.location);
    setJobType(INITIAL_FORM_STATE.type);
    setSalaryRange(INITIAL_FORM_STATE.salaryRange);
    setEditingId(null);
    setFormError(null);
  }

  function openCreateForm() {
    resetForm();
    setShowSyncModal(false);
    setShowForm(true);
  }

  function openEditForm(posting: JobPosting) {
    setTitle(posting.title);
    setCompany(posting.company);
    setDescription(posting.description);
    setRequirementsText(posting.requirements.join(", "));
    setSkillsText(posting.skills.join(", "));
    setCourseSlug(posting.courseSlug ?? "");
    setLocation(posting.location);
    setJobType(posting.type);
    setSalaryRange(posting.salaryRange ?? "");
    setEditingId(posting.id);
    setFormError(null);
    setShowSyncModal(false);
    setShowForm(true);
  }

  function closeForm() {
    resetForm();
    setShowForm(false);
  }

  /* ---------------------------------------------------------------- */
  /*  Submit create / update                                           */
  /* ---------------------------------------------------------------- */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    const requirements = requirementsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const skills = skillsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const body = {
      title: title.trim(),
      company: company.trim(),
      description: description.trim(),
      requirements,
      skills,
      courseSlug: courseSlug || null,
      location: location.trim(),
      type: jobType,
      salaryRange: salaryRange.trim() || null,
    };

    try {
      const url = editingId
        ? `/api/admin/job-postings/${editingId}`
        : "/api/admin/job-postings";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!json.success) {
        setFormError(json.error ?? "Something went wrong");
        return;
      }

      closeForm();
      await fetchPostings();
    } catch {
      setFormError("Failed to save job posting. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Delete                                                           */
  /* ---------------------------------------------------------------- */

  async function handleDelete(id: string) {
    if (
      !confirm(
        "Delete this job posting? This will also remove all associated matches.",
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/job-postings/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.error ?? "Failed to delete");
        return;
      }

      await fetchPostings();
    } catch {
      setError("Failed to delete job posting.");
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Counts                                                           */
  /* ---------------------------------------------------------------- */

  const manualCount = postings.filter((p) => !p.externalSource).length;
  const remotiveCount = postings.filter(
    (p) => p.externalSource === "remotive",
  ).length;
  const jsearchCount = postings.filter(
    (p) => p.externalSource === "jsearch",
  ).length;

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
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-sm text-gray-500">
            {postings.length} job posting{postings.length !== 1 ? "s" : ""}
          </p>
          {postings.length > 0 && (
            <div className="flex gap-1.5">
              {manualCount > 0 && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {manualCount} Manual
                </span>
              )}
              {remotiveCount > 0 && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                  {remotiveCount} Remotive
                </span>
              )}
              {jsearchCount > 0 && (
                <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
                  {jsearchCount} JSearch
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-1.5"
            onClick={() => {
              setShowForm(false);
              setShowSyncModal(true);
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Sync Jobs
          </Button>
          <Button className="gap-1.5" onClick={openCreateForm}>
            <Plus className="h-4 w-4" />
            Add Job Posting
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
          {error}
          <Button
            variant="outline"
            size="sm"
            className="ml-3"
            onClick={() => {
              setError(null);
              fetchPostings();
            }}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Sync Modal */}
      {showSyncModal && (
        <SyncModal
          onClose={() => setShowSyncModal(false)}
          onComplete={() => fetchPostings()}
        />
      )}

      {/* Add / Edit Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">
              {editingId ? "Edit Job Posting" : "New Job Posting"}
            </h3>
            <Button variant="ghost" size="sm" onClick={closeForm}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                {formError}
              </div>
            )}

            {/* Title & Company */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="jp-title">Job Title *</Label>
                <Input
                  id="jp-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Medical Virtual Assistant"
                  maxLength={200}
                  required
                />
              </div>
              <div>
                <Label htmlFor="jp-company">Company *</Label>
                <Input
                  id="jp-company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. HealthTech Solutions"
                  maxLength={200}
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="jp-desc">Description *</Label>
              <textarea
                id="jp-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the role, responsibilities, and expectations..."
                maxLength={5000}
                required
                rows={4}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            {/* Requirements & Skills */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="jp-reqs">
                  Requirements * (comma-separated)
                </Label>
                <Input
                  id="jp-reqs"
                  value={requirementsText}
                  onChange={(e) => setRequirementsText(e.target.value)}
                  placeholder="e.g. EHR knowledge, HIPAA compliance, 1yr experience"
                  required
                />
              </div>
              <div>
                <Label htmlFor="jp-skills">Skills * (comma-separated)</Label>
                <Input
                  id="jp-skills"
                  value={skillsText}
                  onChange={(e) => setSkillsText(e.target.value)}
                  placeholder="e.g. Medical Terminology, Data Entry, Scheduling"
                  required
                />
              </div>
            </div>

            {/* Location, Type, Course, Salary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="jp-location">Location *</Label>
                <Input
                  id="jp-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Remote"
                  maxLength={200}
                  required
                />
              </div>
              <div>
                <Label htmlFor="jp-type">Type *</Label>
                <select
                  id="jp-type"
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {JOB_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="jp-course">Course Filter</Label>
                <select
                  id="jp-course"
                  value={courseSlug}
                  onChange={(e) => setCourseSlug(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {COURSE_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="jp-salary">Salary Range</Label>
                <Input
                  id="jp-salary"
                  value={salaryRange}
                  onChange={(e) => setSalaryRange(e.target.value)}
                  placeholder="e.g. $5-8/hr"
                  maxLength={100}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeForm}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Posting"
                    : "Create Posting"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Job Postings List */}
      {postings.length === 0 && !showForm && !showSyncModal ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Briefcase className="h-8 w-8 text-indigo-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            No Job Postings Yet
          </h2>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            Create job postings manually or sync from external job boards so the
            AI can match students to relevant opportunities.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowSyncModal(true)}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Sync From Job Boards
            </Button>
            <Button onClick={openCreateForm} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Manually
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {postings.map((posting) => (
            <div
              key={posting.id}
              className={`bg-white rounded-xl border p-5 ${
                posting.isActive
                  ? "border-gray-200"
                  : "border-gray-200 opacity-60"
              }`}
            >
              {/* Card header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {posting.title}
                    </h3>
                    <SourceBadge source={posting.externalSource} />
                    {!posting.isActive && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full shrink-0">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {posting.company}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {posting.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3 w-3" />
                      {posting.type}
                    </span>
                    {posting.industry && (
                      <span className="text-gray-400">{posting.industry}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {posting.externalUrl && (
                    <a
                      href={posting.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center h-8 w-8 rounded-md text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditForm(posting)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(posting.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Description preview */}
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                {posting.description}
              </p>

              {/* Skills tags */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {posting.skills.slice(0, 6).map((skill) => (
                  <span
                    key={skill}
                    className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full"
                  >
                    {skill}
                  </span>
                ))}
                {posting.skills.length > 6 && (
                  <span className="text-xs text-gray-400">
                    +{posting.skills.length - 6} more
                  </span>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{courseLabel(posting.courseSlug)}</span>
                {posting.salaryRange && (
                  <span className="font-medium text-gray-600">
                    {posting.salaryRange}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
