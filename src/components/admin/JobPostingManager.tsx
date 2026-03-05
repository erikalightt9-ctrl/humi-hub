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
  readonly isActive: boolean;
  readonly createdAt: string;
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

/* ------------------------------------------------------------------ */
/*  Course slug display label                                          */
/* ------------------------------------------------------------------ */

function courseLabel(slug: string | null): string {
  const found = COURSE_OPTIONS.find((c) => c.value === slug);
  return found?.label ?? "Any VA Background";
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
    if (!confirm("Delete this job posting? This will also remove all associated matches.")) {
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
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {postings.length} job posting{postings.length !== 1 ? "s" : ""}
        </p>
        <Button className="gap-1.5" onClick={openCreateForm}>
          <Plus className="h-4 w-4" />
          Add Job Posting
        </Button>
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
                <Label htmlFor="jp-reqs">Requirements * (comma-separated)</Label>
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
      {postings.length === 0 && !showForm ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Briefcase className="h-8 w-8 text-indigo-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            No Job Postings Yet
          </h2>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            Create job postings so the AI can match students to relevant
            opportunities based on their skills and training.
          </p>
          <Button onClick={openCreateForm} className="gap-2">
            <Plus className="h-4 w-4" />
            Add First Job Posting
          </Button>
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
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {posting.title}
                    </h3>
                    {!posting.isActive && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full shrink-0">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
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
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
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
                {posting.skills.map((skill) => (
                  <span
                    key={skill}
                    className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full"
                  >
                    {skill}
                  </span>
                ))}
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
