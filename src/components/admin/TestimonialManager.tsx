"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Loader2,
  Star,
  Pencil,
  Trash2,
  X,
  MessageSquareQuote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Testimonial {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly company: string;
  readonly content: string;
  readonly rating: number;
  readonly avatarUrl: string | null;
  readonly isPublished: boolean;
  readonly displayOrder: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface FormState {
  readonly name: string;
  readonly role: string;
  readonly company: string;
  readonly content: string;
  readonly rating: number;
  readonly avatarUrl: string;
  readonly isPublished: boolean;
  readonly displayOrder: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const INITIAL_FORM_STATE: FormState = {
  name: "",
  role: "",
  company: "",
  content: "",
  rating: 5,
  avatarUrl: "",
  isPublished: false,
  displayOrder: 0,
};

/* ------------------------------------------------------------------ */
/*  Star Rating Component                                              */
/* ------------------------------------------------------------------ */

function StarRating({
  rating,
  max = 5,
  interactive = false,
  onChange,
}: {
  readonly rating: number;
  readonly max?: number;
  readonly interactive?: boolean;
  readonly onChange?: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= rating;
        return (
          <button
            key={starValue}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(starValue)}
            className={`${interactive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"}`}
          >
            <Star
              className={`h-4 w-4 ${
                isFilled
                  ? "fill-amber-400 text-amber-400"
                  : "fill-none text-gray-300"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function TestimonialManager() {
  const [testimonials, setTestimonials] = useState<
    ReadonlyArray<Testimonial>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [name, setName] = useState(INITIAL_FORM_STATE.name);
  const [role, setRole] = useState(INITIAL_FORM_STATE.role);
  const [company, setCompany] = useState(INITIAL_FORM_STATE.company);
  const [content, setContent] = useState(INITIAL_FORM_STATE.content);
  const [rating, setRating] = useState(INITIAL_FORM_STATE.rating);
  const [avatarUrl, setAvatarUrl] = useState(INITIAL_FORM_STATE.avatarUrl);
  const [isPublished, setIsPublished] = useState(
    INITIAL_FORM_STATE.isPublished,
  );
  const [displayOrder, setDisplayOrder] = useState(
    INITIAL_FORM_STATE.displayOrder,
  );

  /* ---------------------------------------------------------------- */
  /*  Fetch testimonials                                               */
  /* ---------------------------------------------------------------- */

  const fetchTestimonials = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/testimonials");
      const json = await res.json();
      if (json.success) {
        setTestimonials(json.data);
      } else {
        setError(json.error ?? "Failed to load testimonials");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  /* ---------------------------------------------------------------- */
  /*  Form helpers                                                     */
  /* ---------------------------------------------------------------- */

  function resetForm() {
    setName(INITIAL_FORM_STATE.name);
    setRole(INITIAL_FORM_STATE.role);
    setCompany(INITIAL_FORM_STATE.company);
    setContent(INITIAL_FORM_STATE.content);
    setRating(INITIAL_FORM_STATE.rating);
    setAvatarUrl(INITIAL_FORM_STATE.avatarUrl);
    setIsPublished(INITIAL_FORM_STATE.isPublished);
    setDisplayOrder(INITIAL_FORM_STATE.displayOrder);
    setEditingId(null);
    setFormError(null);
  }

  function openCreateForm() {
    resetForm();
    setShowForm(true);
  }

  function openEditForm(testimonial: Testimonial) {
    setName(testimonial.name);
    setRole(testimonial.role);
    setCompany(testimonial.company);
    setContent(testimonial.content);
    setRating(testimonial.rating);
    setAvatarUrl(testimonial.avatarUrl ?? "");
    setIsPublished(testimonial.isPublished);
    setDisplayOrder(testimonial.displayOrder);
    setEditingId(testimonial.id);
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

    const body = {
      name: name.trim(),
      role: role.trim(),
      company: company.trim(),
      content: content.trim(),
      rating,
      avatarUrl: avatarUrl.trim() || null,
      isPublished,
      displayOrder,
    };

    try {
      const url = editingId
        ? `/api/admin/testimonials/${editingId}`
        : "/api/admin/testimonials";
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
      await fetchTestimonials();
    } catch {
      setFormError("Failed to save testimonial. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Delete                                                           */
  /* ---------------------------------------------------------------- */

  async function handleDelete(id: string) {
    if (!confirm("Delete this testimonial? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/testimonials/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.error ?? "Failed to delete");
        return;
      }

      await fetchTestimonials();
    } catch {
      setError("Failed to delete testimonial.");
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
          {testimonials.length} testimonial
          {testimonials.length !== 1 ? "s" : ""}
        </p>
        <Button className="gap-1.5" onClick={openCreateForm}>
          <Plus className="h-4 w-4" />
          Add Testimonial
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
              fetchTestimonials();
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
              {editingId ? "Edit Testimonial" : "New Testimonial"}
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

            {/* Name & Role */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="t-name">Name *</Label>
                <Input
                  id="t-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Maria Santos"
                  maxLength={100}
                  required
                />
              </div>
              <div>
                <Label htmlFor="t-role">Role *</Label>
                <Input
                  id="t-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Medical Virtual Assistant"
                  maxLength={100}
                  required
                />
              </div>
            </div>

            {/* Company & Avatar URL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="t-company">Company *</Label>
                <Input
                  id="t-company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. HealthTech Solutions"
                  maxLength={200}
                  required
                />
              </div>
              <div>
                <Label htmlFor="t-avatar">Avatar URL</Label>
                <Input
                  id="t-avatar"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  type="url"
                />
              </div>
            </div>

            {/* Content */}
            <div>
              <Label htmlFor="t-content">Testimonial Content *</Label>
              <textarea
                id="t-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write the testimonial content here..."
                maxLength={2000}
                required
                rows={4}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            {/* Rating, Display Order, Published */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Rating *</Label>
                <div className="mt-1">
                  <StarRating
                    rating={rating}
                    interactive
                    onChange={setRating}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="t-order">Display Order</Label>
                <Input
                  id="t-order"
                  type="number"
                  min={0}
                  value={displayOrder}
                  onChange={(e) =>
                    setDisplayOrder(parseInt(e.target.value, 10) || 0)
                  }
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer pb-2">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Published</span>
                </label>
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
                    ? "Update Testimonial"
                    : "Create Testimonial"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Testimonials List */}
      {testimonials.length === 0 && !showForm ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <div className="bg-amber-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <MessageSquareQuote className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            No Testimonials Yet
          </h2>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            Add testimonials from graduates to showcase on the public site. You
            can control visibility with the published toggle.
          </p>
          <Button onClick={openCreateForm} className="gap-2">
            <Plus className="h-4 w-4" />
            Add First Testimonial
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className={`bg-white rounded-xl border p-5 ${
                testimonial.isPublished
                  ? "border-gray-200"
                  : "border-gray-200 opacity-60"
              }`}
            >
              {/* Card header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {testimonial.name}
                    </h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                        testimonial.isPublished
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {testimonial.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {testimonial.role} at {testimonial.company}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditForm(testimonial)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(testimonial.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Star rating */}
              <div className="mb-2">
                <StarRating rating={testimonial.rating} />
              </div>

              {/* Content preview */}
              <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                {testimonial.content}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Order: {testimonial.displayOrder}</span>
                <span>
                  {new Date(testimonial.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
