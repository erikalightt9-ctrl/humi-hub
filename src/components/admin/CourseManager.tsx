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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SUPPORTED_CURRENCIES,
  CURRENCY_SYMBOLS,
  type CurrencyCode,
} from "@/lib/validations/course.schema";

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
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly _count: CourseCountData;
}

interface FormState {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly durationWeeks: number;
  readonly price: number;
  readonly priceBasic: number;
  readonly priceProfessional: number;
  readonly priceAdvanced: number;
  readonly currency: CurrencyCode;
  readonly outcomes: ReadonlyArray<string>;
  readonly featuresBasic: ReadonlyArray<string>;
  readonly featuresProfessional: ReadonlyArray<string>;
  readonly featuresAdvanced: ReadonlyArray<string>;
  readonly popularTier: string | null;
  readonly industry: string;
  readonly isActive: boolean;
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

const INITIAL_FORM_STATE: FormState = {
  slug: "",
  title: "",
  description: "",
  durationWeeks: 8,
  price: 0,
  priceBasic: 1500,
  priceProfessional: 3500,
  priceAdvanced: 5500,
  currency: "PHP",
  outcomes: [""],
  featuresBasic: DEFAULT_FEATURES_BASIC,
  featuresProfessional: DEFAULT_FEATURES_PROFESSIONAL,
  featuresAdvanced: DEFAULT_FEATURES_ADVANCED,
  popularTier: null,
  industry: "",
  isActive: true,
};

/* ------------------------------------------------------------------ */
/*  Slug display label                                                 */
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

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [slug, setSlug] = useState(INITIAL_FORM_STATE.slug);
  const [title, setTitle] = useState(INITIAL_FORM_STATE.title);
  const [description, setDescription] = useState(
    INITIAL_FORM_STATE.description,
  );
  const [durationWeeks, setDurationWeeks] = useState(
    INITIAL_FORM_STATE.durationWeeks,
  );
  const [price, setPrice] = useState(INITIAL_FORM_STATE.price);
  const [priceBasic, setPriceBasic] = useState(INITIAL_FORM_STATE.priceBasic);
  const [priceProfessional, setPriceProfessional] = useState(INITIAL_FORM_STATE.priceProfessional);
  const [priceAdvanced, setPriceAdvanced] = useState(INITIAL_FORM_STATE.priceAdvanced);
  const [currency, setCurrency] = useState<CurrencyCode>(INITIAL_FORM_STATE.currency);
  const [outcomes, setOutcomes] = useState<ReadonlyArray<string>>(
    INITIAL_FORM_STATE.outcomes,
  );
  const [featuresBasic, setFeaturesBasic] = useState<ReadonlyArray<string>>(INITIAL_FORM_STATE.featuresBasic);
  const [featuresProfessional, setFeaturesProfessional] = useState<ReadonlyArray<string>>(INITIAL_FORM_STATE.featuresProfessional);
  const [featuresAdvanced, setFeaturesAdvanced] = useState<ReadonlyArray<string>>(INITIAL_FORM_STATE.featuresAdvanced);
  const [popularTier, setPopularTier] = useState<string | null>(INITIAL_FORM_STATE.popularTier);
  const [industry, setIndustry] = useState(INITIAL_FORM_STATE.industry);
  const [isActive, setIsActive] = useState(INITIAL_FORM_STATE.isActive);

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
    setSlug(INITIAL_FORM_STATE.slug);
    setTitle(INITIAL_FORM_STATE.title);
    setDescription(INITIAL_FORM_STATE.description);
    setDurationWeeks(INITIAL_FORM_STATE.durationWeeks);
    setPrice(INITIAL_FORM_STATE.price);
    setPriceBasic(INITIAL_FORM_STATE.priceBasic);
    setPriceProfessional(INITIAL_FORM_STATE.priceProfessional);
    setPriceAdvanced(INITIAL_FORM_STATE.priceAdvanced);
    setCurrency(INITIAL_FORM_STATE.currency);
    setOutcomes(INITIAL_FORM_STATE.outcomes);
    setFeaturesBasic(INITIAL_FORM_STATE.featuresBasic);
    setFeaturesProfessional(INITIAL_FORM_STATE.featuresProfessional);
    setFeaturesAdvanced(INITIAL_FORM_STATE.featuresAdvanced);
    setPopularTier(INITIAL_FORM_STATE.popularTier);
    setIndustry(INITIAL_FORM_STATE.industry);
    setIsActive(INITIAL_FORM_STATE.isActive);
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
    setPriceBasic(Number(course.priceBasic));
    setPriceProfessional(Number(course.priceProfessional));
    setPriceAdvanced(Number(course.priceAdvanced));
    setCurrency((course.currency as CurrencyCode) || "PHP");
    setOutcomes(course.outcomes.length > 0 ? course.outcomes : [""]);
    setFeaturesBasic(course.featuresBasic.length > 0 ? course.featuresBasic : DEFAULT_FEATURES_BASIC);
    setFeaturesProfessional(course.featuresProfessional.length > 0 ? course.featuresProfessional : DEFAULT_FEATURES_PROFESSIONAL);
    setFeaturesAdvanced(course.featuresAdvanced.length > 0 ? course.featuresAdvanced : DEFAULT_FEATURES_ADVANCED);
    setPopularTier(course.popularTier ?? null);
    setIndustry(course.industry ?? "");
    setIsActive(course.isActive);
    setEditingId(course.id);
    setFormError(null);
    setShowForm(true);
  }

  function closeForm() {
    resetForm();
    setShowForm(false);
  }

  /* ---------------------------------------------------------------- */
  /*  Outcomes list management                                         */
  /* ---------------------------------------------------------------- */

  function handleOutcomeChange(index: number, value: string) {
    setOutcomes(
      outcomes.map((item, i) => (i === index ? value : item)),
    );
  }

  function addOutcome() {
    setOutcomes([...outcomes, ""]);
  }

  function removeOutcome(index: number) {
    if (outcomes.length <= 1) return;
    setOutcomes(outcomes.filter((_, i) => i !== index));
  }

  /* ---------------------------------------------------------------- */
  /*  Submit create / update                                           */
  /* ---------------------------------------------------------------- */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    const trimmedOutcomes = outcomes
      .map((o) => o.trim())
      .filter((o) => o.length > 0);

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
      priceBasic,
      priceProfessional,
      priceAdvanced,
      currency,
      outcomes: trimmedOutcomes,
      featuresBasic: featuresBasic.map((f) => f.trim()).filter((f) => f.length > 0),
      featuresProfessional: featuresProfessional.map((f) => f.trim()).filter((f) => f.length > 0),
      featuresAdvanced: featuresAdvanced.map((f) => f.trim()).filter((f) => f.length > 0),
      popularTier: popularTier || null,
      industry: industry.trim() || undefined,
      isActive,
    };

    try {
      const url = editingId
        ? `/api/admin/courses/${editingId}`
        : "/api/admin/courses";
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
  /*  Toggle active/inactive                                           */
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

  /* ---------------------------------------------------------------- */
  /*  Soft-delete                                                      */
  /* ---------------------------------------------------------------- */

  async function handleDelete(id: string) {
    if (
      !confirm(
        "Deactivate this course? It will be marked as inactive and hidden from students.",
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/courses/${id}`, {
        method: "DELETE",
      });
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

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {courses.length} course{courses.length !== 1 ? "s" : ""}
        </p>
        <Button className="gap-1.5" onClick={openCreateForm}>
          <Plus className="h-4 w-4" />
          Create Course
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

            {/* Tier Pricing & Features */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="block">Course Tier Pricing & Features</Label>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Set price and features for each enrollment tier. Features sync automatically to the enrollment page.
              </p>

              {/* Popular Tier selector */}
              <div className="mb-4">
                <Label htmlFor="c-popular-tier" className="text-xs text-gray-600">Most Popular Tier</Label>
                <select
                  id="c-popular-tier"
                  value={popularTier ?? ""}
                  onChange={(e) => setPopularTier(e.target.value || null)}
                  className="flex h-9 w-full max-w-xs rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mt-1"
                >
                  <option value="">None</option>
                  <option value="BASIC">Basic</option>
                  <option value="PROFESSIONAL">Professional</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Basic Tier */}
                <div className="border border-gray-200 rounded-lg p-3 space-y-2">
                  <p className="text-gray-700 text-xs font-semibold uppercase tracking-wide">Basic</p>
                  <div>
                    <Label htmlFor="c-price-basic" className="text-gray-500 text-xs">Price (₱)</Label>
                    <Input
                      id="c-price-basic"
                      type="text"
                      inputMode="decimal"
                      value={priceBasic}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, "");
                        setPriceBasic(val === "" ? 0 : parseFloat(val) || 0);
                      }}
                    />
                  </div>
                  <div>
                    <Label className="text-gray-500 text-xs">Features</Label>
                    <div className="space-y-1 mt-1">
                      {featuresBasic.map((f, i) => (
                        <div key={i} className="flex gap-1">
                          <Input
                            value={f}
                            onChange={(e) => setFeaturesBasic(featuresBasic.map((x, j) => j === i ? e.target.value : x))}
                            placeholder={`Feature ${i + 1}`}
                            className="text-xs h-7"
                          />
                          {featuresBasic.length > 1 && (
                            <button type="button" onClick={() => setFeaturesBasic(featuresBasic.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 shrink-0">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={() => setFeaturesBasic([...featuresBasic, ""])} className="text-xs text-gray-500 hover:text-gray-700 mt-1 flex items-center gap-1">
                      <Plus className="h-3 w-3" /> Add feature
                    </button>
                  </div>
                </div>

                {/* Professional Tier */}
                <div className="border border-blue-200 rounded-lg p-3 bg-blue-50/30 space-y-2">
                  <p className="text-blue-700 text-xs font-semibold uppercase tracking-wide">Professional</p>
                  <div>
                    <Label htmlFor="c-price-pro" className="text-blue-600 text-xs">Price (₱)</Label>
                    <Input
                      id="c-price-pro"
                      type="text"
                      inputMode="decimal"
                      value={priceProfessional}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, "");
                        setPriceProfessional(val === "" ? 0 : parseFloat(val) || 0);
                      }}
                    />
                  </div>
                  <div>
                    <Label className="text-blue-600 text-xs">Features</Label>
                    <div className="space-y-1 mt-1">
                      {featuresProfessional.map((f, i) => (
                        <div key={i} className="flex gap-1">
                          <Input
                            value={f}
                            onChange={(e) => setFeaturesProfessional(featuresProfessional.map((x, j) => j === i ? e.target.value : x))}
                            placeholder={`Feature ${i + 1}`}
                            className="text-xs h-7"
                          />
                          {featuresProfessional.length > 1 && (
                            <button type="button" onClick={() => setFeaturesProfessional(featuresProfessional.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 shrink-0">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={() => setFeaturesProfessional([...featuresProfessional, ""])} className="text-xs text-blue-500 hover:text-blue-700 mt-1 flex items-center gap-1">
                      <Plus className="h-3 w-3" /> Add feature
                    </button>
                  </div>
                </div>

                {/* Advanced Tier */}
                <div className="border border-purple-200 rounded-lg p-3 bg-purple-50/30 space-y-2">
                  <p className="text-purple-700 text-xs font-semibold uppercase tracking-wide">Advanced</p>
                  <div>
                    <Label htmlFor="c-price-adv" className="text-purple-600 text-xs">Price (₱)</Label>
                    <Input
                      id="c-price-adv"
                      type="text"
                      inputMode="decimal"
                      value={priceAdvanced}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, "");
                        setPriceAdvanced(val === "" ? 0 : parseFloat(val) || 0);
                      }}
                    />
                  </div>
                  <div>
                    <Label className="text-purple-600 text-xs">Features</Label>
                    <div className="space-y-1 mt-1">
                      {featuresAdvanced.map((f, i) => (
                        <div key={i} className="flex gap-1">
                          <Input
                            value={f}
                            onChange={(e) => setFeaturesAdvanced(featuresAdvanced.map((x, j) => j === i ? e.target.value : x))}
                            placeholder={`Feature ${i + 1}`}
                            className="text-xs h-7"
                          />
                          {featuresAdvanced.length > 1 && (
                            <button type="button" onClick={() => setFeaturesAdvanced(featuresAdvanced.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 shrink-0">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={() => setFeaturesAdvanced([...featuresAdvanced, ""])} className="text-xs text-purple-500 hover:text-purple-700 mt-1 flex items-center gap-1">
                      <Plus className="h-3 w-3" /> Add feature
                    </button>
                  </div>
                </div>
              </div>
            </div>

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
                      onChange={(e) =>
                        handleOutcomeChange(index, e.target.value)
                      }
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
                    ? "Update Course"
                    : "Create Course"}
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
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            No Courses Yet
          </h2>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            Create your first course to start managing lessons, quizzes, and
            student enrollments.
          </p>
          <Button onClick={openCreateForm} className="gap-2">
            <Plus className="h-4 w-4" />
            Create First Course
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className={`bg-white rounded-xl border p-6 hover:shadow-md transition-shadow ${
                course.isActive
                  ? "border-gray-200"
                  : "border-gray-200 opacity-60"
              }`}
            >
              {/* Card header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {course.title}
                    </h3>
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditForm(course)}
                  >
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
              <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                {course.description}
              </p>

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
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {course.durationWeeks}w
                  </span>
                  <span className="flex items-center gap-1">
                    {CURRENCY_SYMBOLS[(course.currency as CurrencyCode) || "PHP"]}
                    {Number(course.price).toLocaleString()}
                  </span>
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
