"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Loader2,
  Pencil,
  Trash2,
  X,
  BookOpen,
  Users,
  FileText,
  Clock,
  GraduationCap,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SUPPORTED_CURRENCIES,
  CURRENCY_SYMBOLS,
  type CurrencyCode,
} from "@/lib/validations/course.schema";
import {
  CourseTierPricingEditor,
  type TierEditorState,
} from "@/components/admin/CourseTierPricingEditor";
import { CoursePriceHistoryPanel } from "@/components/admin/CoursePriceHistoryPanel";
import { parseDiscount } from "@/lib/types/discount";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CourseCountData {
  readonly enrollments: number;
  readonly lessons: number;
  readonly quizzes: number;
  readonly assignments: number;
  readonly trainers: number;
  readonly resources: number;
}

interface Course {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly durationWeeks: number;
  readonly price: string;
  readonly priceBasic: string;
  readonly priceProfessional: string;
  readonly priceAdvanced: string;
  readonly currency: string;
  readonly outcomes: ReadonlyArray<string>;
  readonly featuresBasic: ReadonlyArray<string>;
  readonly featuresProfessional: ReadonlyArray<string>;
  readonly featuresAdvanced: ReadonlyArray<string>;
  readonly popularTier: string | null;
  readonly industry: string | null;
  readonly isActive: boolean;
  readonly discountBasic: unknown;
  readonly discountProfessional: unknown;
  readonly discountAdvanced: unknown;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly _count: CourseCountData;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const DEFAULT_FEATURES_BASIC = [
  "Introduction modules",
  "Core concept lessons",
  "Beginner exercises",
  "Simple quizzes",
  "Basic certificate",
];

const DEFAULT_FEATURES_PROFESSIONAL = [
  "Everything in Basic",
  "Case studies",
  "Hands-on exercises",
  "Applied quizzes",
  "Professional certificate",
  "Community access",
];

const DEFAULT_FEATURES_ADVANCED = [
  "Everything in Professional",
  "Industry tools training",
  "Real-world scenarios",
  "Mastery assessments",
  "Advanced certificate",
  "1-on-1 mentoring",
  "Job placement support",
];

const INDUSTRY_SUGGESTIONS = [
  "Healthcare",
  "Real Estate",
  "Finance",
  "Legal",
  "Technology",
  "E-Commerce",
  "Business",
  "Customer Success",
  "Education",
  "Marketing",
] as const;

const INITIAL_TIER_STATE: TierEditorState = {
  priceBasic: 0,
  priceProfessional: 0,
  priceAdvanced: 0,
  featuresBasic: DEFAULT_FEATURES_BASIC,
  featuresProfessional: DEFAULT_FEATURES_PROFESSIONAL,
  featuresAdvanced: DEFAULT_FEATURES_ADVANCED,
  discountBasic: null,
  discountProfessional: null,
  discountAdvanced: null,
  popularTier: null,
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function slugLabel(slug: string): string {
  return slug
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function CourseManager() {
  const [courses, setCourses] = useState<ReadonlyArray<Course>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Non-tier form fields
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationWeeks, setDurationWeeks] = useState(8);
  const [price, setPrice] = useState(0);
  const [currency, setCurrency] = useState<CurrencyCode>("PHP");
  const [outcomes, setOutcomes] = useState<ReadonlyArray<string>>(["",]);
  const [industry, setIndustry] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Consolidated tier state
  const [tierState, setTierState] = useState<TierEditorState>(INITIAL_TIER_STATE);

  // When creating a new course, auto-sync the base price to all three tier
  // inputs so the tier pricing editor always starts from the entered price,
  // not from stale hardcoded defaults.
  useEffect(() => {
    if (!editingId && price > 0) {
      setTierState((prev) => ({
        ...prev,
        priceBasic: price,
        priceProfessional: price,
        priceAdvanced: price,
      }));
    }
  }, [price, editingId]);

  /* ---------------------------------------------------------------- */
  /*  Fetch courses                                                    */
  /* ---------------------------------------------------------------- */

  const fetchCourses = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/courses");
      const json = await res.json();
      if (json.success) {
        setCourses(json.data);
      } else {
        setError(json.error ?? "Failed to load courses");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  /* ---------------------------------------------------------------- */
  /*  Form helpers                                                     */
  /* ---------------------------------------------------------------- */

  function resetForm() {
    setSlug("");
    setTitle("");
    setDescription("");
    setDurationWeeks(8);
    setPrice(0);
    setCurrency("PHP");
    setOutcomes([""]);
    setIndustry("");
    setIsActive(true);
    setTierState(INITIAL_TIER_STATE);
    setEditingId(null);
    setFormError(null);
  }

  function openCreateForm() {
    resetForm();
    setShowForm(true);
  }

  function openEditForm(course: Course) {
    setSlug(course.slug);
    setTitle(course.title);
    setDescription(course.description);
    setDurationWeeks(course.durationWeeks);
    setPrice(Number(course.price));
    setCurrency((course.currency as CurrencyCode) || "PHP");
    setOutcomes(course.outcomes.length > 0 ? course.outcomes : [""]);
    setIndustry(course.industry ?? "");
    setIsActive(course.isActive);
    setTierState({
      priceBasic: Number(course.priceBasic),
      priceProfessional: Number(course.priceProfessional),
      priceAdvanced: Number(course.priceAdvanced),
      featuresBasic: course.featuresBasic.length > 0 ? course.featuresBasic : DEFAULT_FEATURES_BASIC,
      featuresProfessional: course.featuresProfessional.length > 0 ? course.featuresProfessional : DEFAULT_FEATURES_PROFESSIONAL,
      featuresAdvanced: course.featuresAdvanced.length > 0 ? course.featuresAdvanced : DEFAULT_FEATURES_ADVANCED,
      discountBasic: parseDiscount(course.discountBasic),
      discountProfessional: parseDiscount(course.discountProfessional),
      discountAdvanced: parseDiscount(course.discountAdvanced),
      popularTier: course.popularTier ?? null,
    });
    setEditingId(course.id);
    setFormError(null);
    setShowForm(true);
  }

  function closeForm() {
    resetForm();
    setShowForm(false);
  }

  /* ---------------------------------------------------------------- */
  /*  Outcomes management                                              */
  /* ---------------------------------------------------------------- */

  function handleOutcomeChange(index: number, value: string) {
    setOutcomes(outcomes.map((item, i) => (i === index ? value : item)));
  }

  function addOutcome() {
    setOutcomes([...outcomes, ""]);
  }

  function removeOutcome(index: number) {
    if (outcomes.length <= 1) return;
    setOutcomes(outcomes.filter((_, i) => i !== index));
  }

  /* ---------------------------------------------------------------- */
  /*  Submit                                                           */
  /* ---------------------------------------------------------------- */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    const trimmedOutcomes = outcomes.map((o) => o.trim()).filter((o) => o.length > 0);
    if (trimmedOutcomes.length === 0) {
      setFormError("At least one outcome is required");
      setSaving(false);
      return;
    }

    const body = {
      slug,
      title: title.trim(),
      description: description.trim(),
      durationWeeks,
      price,
      priceBasic: tierState.priceBasic,
      priceProfessional: tierState.priceProfessional,
      priceAdvanced: tierState.priceAdvanced,
      currency,
      outcomes: trimmedOutcomes,
      featuresBasic: tierState.featuresBasic.map((f) => f.trim()).filter((f) => f.length > 0),
      featuresProfessional: tierState.featuresProfessional.map((f) => f.trim()).filter((f) => f.length > 0),
      featuresAdvanced: tierState.featuresAdvanced.map((f) => f.trim()).filter((f) => f.length > 0),
      popularTier: tierState.popularTier || null,
      discountBasic: tierState.discountBasic,
      discountProfessional: tierState.discountProfessional,
      discountAdvanced: tierState.discountAdvanced,
      industry: industry.trim() || undefined,
      isActive,
    };

    try {
      const url = editingId ? `/api/admin/courses/${editingId}` : "/api/admin/courses";
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
      await fetchCourses();
    } catch {
      setFormError("Failed to save course. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Toggle active / soft-delete                                      */
  /* ---------------------------------------------------------------- */

  async function handleToggleActive(course: Course) {
    try {
      const res = await fetch(`/api/admin/courses/${course.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !course.isActive }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Failed to update status");
        return;
      }
      await fetchCourses();
    } catch {
      setError("Failed to toggle course status.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Deactivate this course? It will be marked as inactive and hidden from students.")) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/courses/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Failed to deactivate");
        return;
      }
      await fetchCourses();
    } catch {
      setError("Failed to deactivate course.");
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

  const filteredCourses = searchQuery.trim()
    ? courses.filter((c) => {
        const q = searchQuery.toLowerCase();
        return (
          c.title.toLowerCase().includes(q) ||
          (c.industry ?? "").toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
        );
      })
    : courses;

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <Input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search courses…"
            className="pl-9"
            aria-label="Search courses"
          />
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-500 whitespace-nowrap">
            {filteredCourses.length} / {courses.length} course{courses.length !== 1 ? "s" : ""}
          </p>
          <Button className="gap-1.5" onClick={openCreateForm}>
            <Plus className="h-4 w-4" />
            Create Course
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
              fetchCourses();
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
              {editingId ? "Edit Course" : "New Course"}
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

            {/* Slug & Title */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="c-slug">Course Slug *</Label>
                <Input
                  id="c-slug"
                  value={slug}
                  onChange={(e) =>
                    setSlug(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))
                  }
                  placeholder="e.g. MEDICAL_VA"
                  maxLength={50}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Uppercase letters, numbers, and underscores only
                </p>
              </div>
              <div>
                <Label htmlFor="c-title">Title *</Label>
                <Input
                  id="c-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Medical Virtual Assistant Training"
                  maxLength={200}
                  required
                />
              </div>
            </div>

            {/* Industry */}
            <div>
              <Label htmlFor="c-industry">Industry</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="c-industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. Healthcare, Real Estate, Finance..."
                  maxLength={100}
                  list="industry-suggestions"
                />
                <datalist id="industry-suggestions">
                  {INDUSTRY_SUGGESTIONS.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Used to group courses in Browse by Industry sections
              </p>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="c-desc">Description *</Label>
              <textarea
                id="c-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed description of the course content and what students will learn..."
                minLength={10}
                required
                rows={4}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            {/* Duration, Price, Currency, Active */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="c-duration">Duration (weeks) *</Label>
                <Input
                  id="c-duration"
                  type="text"
                  inputMode="numeric"
                  value={durationWeeks}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, "");
                    setDurationWeeks(val === "" ? 0 : parseInt(val, 10));
                  }}
                  required
                />
              </div>
              <div>
                <Label htmlFor="c-price">Base Price *</Label>
                <Input
                  id="c-price"
                  type="text"
                  inputMode="decimal"
                  value={price}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, "");
                    setPrice(val === "" ? 0 : parseFloat(val) || 0);
                  }}
                  required
                />
              </div>
              <div>
                <Label htmlFor="c-currency">Currency</Label>
                <select
                  id="c-currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {CURRENCY_SYMBOLS[c]} {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer pb-2">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>
            </div>

            {/* Tier Pricing Editor (extracted component) */}
            <CourseTierPricingEditor value={tierState} onChange={setTierState} />

            {/* Price History (edit mode only) */}
            {editingId && <CoursePriceHistoryPanel courseId={editingId} />}

            {/* Outcomes */}
            <div>
              <Label>Learning Outcomes *</Label>
              <p className="text-xs text-gray-500 mb-2">
                Define what students will achieve after completing the course.
              </p>
              <div className="space-y-2">
                {outcomes.map((outcome, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={outcome}
                      onChange={(e) => handleOutcomeChange(index, e.target.value)}
                      placeholder={`Outcome ${index + 1}`}
                    />
                    {outcomes.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOutcome(index)}
                        className="text-red-500 hover:text-red-700 shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 gap-1"
                onClick={addOutcome}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Outcome
              </Button>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeForm} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Update Course" : "Create Course"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Course Cards */}
      {courses.length === 0 && !showForm ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No Courses Yet</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            Create your first course to start managing lessons, quizzes, and student enrollments.
          </p>
          <Button onClick={openCreateForm} className="gap-2">
            <Plus className="h-4 w-4" />
            Create First Course
          </Button>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <Search className="h-8 w-8 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-700 font-medium">No courses match your search</p>
          <p className="text-sm text-gray-500 mt-1">
            Try a different keyword or{" "}
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-blue-600 underline hover:text-blue-700"
            >
              clear the search
            </button>
            .
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className={`bg-white rounded-xl border p-6 hover:shadow-md transition-shadow ${
                course.isActive ? "border-gray-200" : "border-gray-200 opacity-60"
              }`}
            >
              {/* Card header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">{course.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                      {slugLabel(course.slug)}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        course.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {course.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <Button variant="ghost" size="sm" onClick={() => openEditForm(course)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(course.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Description preview */}
              <p className="text-sm text-gray-600 line-clamp-2 mb-4">{course.description}</p>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span>{course._count.enrollments} enrolled</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="h-4 w-4 text-green-500" />
                  <span>{course._count.lessons} lessons</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <BookOpen className="h-4 w-4 text-purple-500" />
                  <span>{course._count.quizzes} quizzes</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <GraduationCap className="h-4 w-4 text-amber-500" />
                  <span>{course._count.assignments} assignments</span>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex flex-col gap-1">
                  <span className="flex items-center gap-1 text-sm text-gray-600">
                    <Clock className="h-3.5 w-3.5" />
                    {course.durationWeeks}w
                  </span>
                  {/* Show tier prices — these are what students see on the enrollment page */}
                  <div className="flex items-center gap-1.5 text-xs flex-wrap">
                    <span className="text-gray-400">Basic:</span>
                    <span className="font-semibold text-gray-700">
                      {CURRENCY_SYMBOLS[(course.currency as CurrencyCode) || "PHP"]}
                      {Number(course.priceBasic).toLocaleString()}
                    </span>
                    <span className="text-gray-300">·</span>
                    <span className="text-gray-400">Pro:</span>
                    <span className="font-semibold text-gray-700">
                      {CURRENCY_SYMBOLS[(course.currency as CurrencyCode) || "PHP"]}
                      {Number(course.priceProfessional).toLocaleString()}
                    </span>
                    <span className="text-gray-300">·</span>
                    <span className="text-gray-400">Adv:</span>
                    <span className="font-semibold text-gray-700">
                      {CURRENCY_SYMBOLS[(course.currency as CurrencyCode) || "PHP"]}
                      {Number(course.priceAdvanced).toLocaleString()}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleActive(course)}
                  className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${
                    course.isActive
                      ? "text-amber-700 bg-amber-50 hover:bg-amber-100"
                      : "text-green-700 bg-green-50 hover:bg-green-100"
                  }`}
                >
                  {course.isActive ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
