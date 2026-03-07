"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Loader2,
  Pencil,
  Trash2,
  X,
  UserCog,
  Mail,
  Phone,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Camera,
  ImageOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CourseAssignment {
  readonly id: string;
  readonly courseId: string;
  readonly trainerId: string;
  readonly role: string;
  readonly assignedAt: string;
  readonly course: {
    readonly id: string;
    readonly title: string;
    readonly slug: string;
    readonly isActive: boolean;
  };
}

interface Trainer {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly phone: string | null;
  readonly bio: string | null;
  readonly photoUrl: string | null;
  readonly specializations: ReadonlyArray<string>;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly _count?: { readonly courses: number };
  readonly courses?: ReadonlyArray<CourseAssignment>;
}

interface Course {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly isActive: boolean;
}

interface FormState {
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly bio: string;
  readonly photoUrl: string;
  readonly specializations: ReadonlyArray<string>;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const INITIAL_FORM_STATE: FormState = {
  name: "",
  email: "",
  phone: "",
  bio: "",
  photoUrl: "",
  specializations: [],
};

const MAX_PHOTO_SIZE_BYTES = 500_000; // ~500KB

const TRAINER_ROLES = [
  { value: "instructor", label: "Instructor" },
  { value: "assistant", label: "Assistant" },
  { value: "mentor", label: "Mentor" },
  { value: "guest", label: "Guest Lecturer" },
] as const;

/* ------------------------------------------------------------------ */
/*  Specialization Tag Input                                           */
/* ------------------------------------------------------------------ */

function SpecializationTags({
  tags,
  onAdd,
  onRemove,
}: {
  readonly tags: ReadonlyArray<string>;
  readonly onAdd: (tag: string) => void;
  readonly onRemove: (index: number) => void;
}) {
  const [input, setInput] = useState("");

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const trimmed = input.trim();
      if (trimmed && !tags.includes(trimmed)) {
        onAdd(trimmed);
        setInput("");
      }
    }
  }

  function handleAddClick() {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onAdd(trimmed);
      setInput("");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((tag, idx) => (
          <span
            key={tag}
            className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs inline-flex items-center gap-1"
          >
            {tag}
            <button
              type="button"
              onClick={() => onRemove(idx)}
              className="text-blue-400 hover:text-blue-700 ml-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type and press Enter to add"
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddClick}
          disabled={!input.trim()}
        >
          Add
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function TrainerManager() {
  const [trainers, setTrainers] = useState<ReadonlyArray<Trainer>>([]);
  const [courses, setCourses] = useState<ReadonlyArray<Course>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [name, setName] = useState(INITIAL_FORM_STATE.name);
  const [email, setEmail] = useState(INITIAL_FORM_STATE.email);
  const [phone, setPhone] = useState(INITIAL_FORM_STATE.phone);
  const [bio, setBio] = useState(INITIAL_FORM_STATE.bio);
  const [photoUrl, setPhotoUrl] = useState(INITIAL_FORM_STATE.photoUrl);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [specializations, setSpecializations] = useState<
    ReadonlyArray<string>
  >(INITIAL_FORM_STATE.specializations);

  // Expanded trainer for course assignments
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedTrainer, setExpandedTrainer] = useState<Trainer | null>(null);
  const [expandedLoading, setExpandedLoading] = useState(false);

  // Course assignment form
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedRole, setSelectedRole] = useState("instructor");
  const [assigning, setAssigning] = useState(false);

  /* ---------------------------------------------------------------- */
  /*  Fetch trainers                                                   */
  /* ---------------------------------------------------------------- */

  const fetchTrainers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/trainers");
      const json = await res.json();
      if (json.success) {
        setTrainers(json.data);
      } else {
        setError(json.error ?? "Failed to load trainers");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCourses = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/courses");
      const json = await res.json();
      if (json.success) {
        setCourses(json.data);
      }
    } catch {
      // Courses are supplementary; do not block main flow
    }
  }, []);

  useEffect(() => {
    fetchTrainers();
    fetchCourses();
  }, [fetchTrainers, fetchCourses]);

  /* ---------------------------------------------------------------- */
  /*  Fetch single trainer for expanded view                           */
  /* ---------------------------------------------------------------- */

  const fetchTrainerDetail = useCallback(async (id: string) => {
    setExpandedLoading(true);
    try {
      const res = await fetch(`/api/admin/trainers/${id}`);
      const json = await res.json();
      if (json.success) {
        setExpandedTrainer(json.data);
      }
    } catch {
      // Silently fail for expansion
    } finally {
      setExpandedLoading(false);
    }
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Form helpers                                                     */
  /* ---------------------------------------------------------------- */

  function resetForm() {
    setName(INITIAL_FORM_STATE.name);
    setEmail(INITIAL_FORM_STATE.email);
    setPhone(INITIAL_FORM_STATE.phone);
    setBio(INITIAL_FORM_STATE.bio);
    setPhotoUrl(INITIAL_FORM_STATE.photoUrl);
    setPhotoPreview(null);
    setSpecializations(INITIAL_FORM_STATE.specializations);
    setEditingId(null);
    setFormError(null);
  }

  function openCreateForm() {
    resetForm();
    setShowForm(true);
  }

  function openEditForm(trainer: Trainer) {
    setName(trainer.name);
    setEmail(trainer.email);
    setPhone(trainer.phone ?? "");
    setBio(trainer.bio ?? "");
    setPhotoUrl(trainer.photoUrl ?? "");
    setPhotoPreview(trainer.photoUrl ?? null);
    setSpecializations(trainer.specializations);
    setEditingId(trainer.id);
    setFormError(null);
    setShowForm(true);
  }

  function closeForm() {
    resetForm();
    setShowForm(false);
  }

  /* ---------------------------------------------------------------- */
  /*  Toggle expanded trainer                                          */
  /* ---------------------------------------------------------------- */

  function toggleExpand(trainerId: string) {
    if (expandedId === trainerId) {
      setExpandedId(null);
      setExpandedTrainer(null);
    } else {
      setExpandedId(trainerId);
      setSelectedCourseId("");
      setSelectedRole("instructor");
      fetchTrainerDetail(trainerId);
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Submit create / update                                           */
  /* ---------------------------------------------------------------- */

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError("Please select an image file (JPG, PNG, etc.)");
      return;
    }

    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      setFormError("Photo must be smaller than 500KB. Please resize it.");
      return;
    }

    setFormError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPhotoUrl(dataUrl);
      setPhotoPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  function removePhoto() {
    setPhotoUrl("");
    setPhotoPreview(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    const body = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      bio: bio.trim() || undefined,
      photoUrl: photoUrl || null,
      specializations: specializations.length > 0
        ? [...specializations]
        : undefined,
    };

    try {
      const url = editingId
        ? `/api/admin/trainers/${editingId}`
        : "/api/admin/trainers";
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
      await fetchTrainers();
    } catch {
      setFormError("Failed to save trainer. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Toggle active / inactive                                         */
  /* ---------------------------------------------------------------- */

  async function handleToggleActive(trainer: Trainer) {
    try {
      const res = await fetch(`/api/admin/trainers/${trainer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !trainer.isActive }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Failed to update status");
        return;
      }
      await fetchTrainers();
    } catch {
      setError("Failed to update trainer status.");
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Soft delete                                                      */
  /* ---------------------------------------------------------------- */

  async function handleDelete(id: string) {
    if (!confirm("Deactivate this trainer? They will be marked as inactive.")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/trainers/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.error ?? "Failed to deactivate");
        return;
      }

      await fetchTrainers();
    } catch {
      setError("Failed to deactivate trainer.");
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Course assignment                                                */
  /* ---------------------------------------------------------------- */

  async function handleAssignCourse() {
    if (!expandedId || !selectedCourseId) return;
    setAssigning(true);

    try {
      const res = await fetch(`/api/admin/trainers/${expandedId}/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourseId,
          role: selectedRole,
        }),
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.error ?? "Failed to assign course");
        return;
      }

      setSelectedCourseId("");
      setSelectedRole("instructor");
      await fetchTrainerDetail(expandedId);
      await fetchTrainers();
    } catch {
      setError("Failed to assign course.");
    } finally {
      setAssigning(false);
    }
  }

  async function handleUnassignCourse(courseId: string) {
    if (!expandedId) return;

    try {
      const res = await fetch(`/api/admin/trainers/${expandedId}/courses`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.error ?? "Failed to remove course assignment");
        return;
      }

      await fetchTrainerDetail(expandedId);
      await fetchTrainers();
    } catch {
      setError("Failed to remove course assignment.");
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Derive available courses for assignment dropdown                  */
  /* ---------------------------------------------------------------- */

  function getAvailableCourses(): ReadonlyArray<Course> {
    if (!expandedTrainer?.courses) return courses;
    const assignedIds = new Set(
      expandedTrainer.courses.map((ct) => ct.courseId),
    );
    return courses.filter((c) => !assignedIds.has(c.id));
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
          {trainers.length} trainer{trainers.length !== 1 ? "s" : ""}
        </p>
        <Button className="gap-1.5" onClick={openCreateForm}>
          <Plus className="h-4 w-4" />
          Add Trainer
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
              fetchTrainers();
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
              {editingId ? "Edit Trainer" : "New Trainer"}
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

            {/* Photo Upload */}
            <div>
              <Label>Trainer Photo</Label>
              <div className="flex items-center gap-4 mt-1">
                {photoPreview ? (
                  <div className="relative">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="h-20 w-20 rounded-full object-cover border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                      title="Remove photo"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                    <Camera className="h-6 w-6 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <label
                    htmlFor="trainer-photo"
                    className="inline-flex items-center gap-1.5 cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    {photoPreview ? "Change Photo" : "Upload Photo"}
                  </label>
                  <input
                    id="trainer-photo"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    JPG, PNG · Max 500KB
                  </p>
                </div>
              </div>
            </div>

            {/* Name & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tr-name">Name *</Label>
                <Input
                  id="tr-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Ana Reyes"
                  maxLength={100}
                  required
                />
              </div>
              <div>
                <Label htmlFor="tr-email">Email *</Label>
                <Input
                  id="tr-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="trainer@example.com"
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tr-phone">Phone</Label>
                <Input
                  id="tr-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+63 912 345 6789"
                  maxLength={20}
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <Label htmlFor="tr-bio">Bio</Label>
              <textarea
                id="tr-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Brief professional bio..."
                maxLength={2000}
                rows={3}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            {/* Specializations */}
            <div>
              <Label>Specializations</Label>
              <SpecializationTags
                tags={specializations}
                onAdd={(tag) =>
                  setSpecializations([...specializations, tag])
                }
                onRemove={(idx) =>
                  setSpecializations(
                    specializations.filter((_, i) => i !== idx),
                  )
                }
              />
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
                    ? "Update Trainer"
                    : "Create Trainer"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Trainers List */}
      {trainers.length === 0 && !showForm ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <UserCog className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            No Trainers Yet
          </h2>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            Add trainers to manage instructor assignments and course coverage.
          </p>
          <Button onClick={openCreateForm} className="gap-2">
            <Plus className="h-4 w-4" />
            Add First Trainer
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {trainers.map((trainer) => {
            const isExpanded = expandedId === trainer.id;

            return (
              <div
                key={trainer.id}
                className={`bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow ${
                  !trainer.isActive ? "opacity-60" : ""
                }`}
              >
                {/* Card header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Trainer Photo */}
                    {trainer.photoUrl ? (
                      <img
                        src={trainer.photoUrl}
                        alt={trainer.name}
                        className="h-14 w-14 rounded-full object-cover border-2 border-gray-200 shrink-0"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-full bg-blue-50 flex items-center justify-center shrink-0 border-2 border-gray-200">
                        <UserCog className="h-6 w-6 text-blue-400" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {trainer.name}
                      </h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                          trainer.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {trainer.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    {/* Contact info */}
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-2">
                      <span className="inline-flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" />
                        {trainer.email}
                      </span>
                      {trainer.phone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          {trainer.phone}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5" />
                        {trainer._count?.courses ?? 0} course
                        {(trainer._count?.courses ?? 0) !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Specializations */}
                    {trainer.specializations.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {trainer.specializations.map((spec) => (
                          <span
                            key={spec}
                            className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Bio preview */}
                    {trainer.bio && !isExpanded && (
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {trainer.bio}
                      </p>
                    )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1 shrink-0 ml-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpand(trainer.id)}
                      title={isExpanded ? "Collapse" : "Expand"}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditForm(trainer)}
                      title="Edit trainer"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(trainer)}
                      title={trainer.isActive ? "Deactivate" : "Activate"}
                      className={
                        trainer.isActive
                          ? "text-amber-600 hover:text-amber-800"
                          : "text-green-600 hover:text-green-800"
                      }
                    >
                      {trainer.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    {trainer.isActive && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(trainer.id)}
                        className="text-red-500 hover:text-red-700"
                        title="Soft delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Expanded section: bio + course assignments */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                    {/* Full bio */}
                    {trainer.bio && (
                      <div>
                        <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                          Bio
                        </h4>
                        <p className="text-sm text-gray-600 whitespace-pre-line">
                          {trainer.bio}
                        </p>
                      </div>
                    )}

                    {/* Assigned courses */}
                    <div>
                      <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                        Assigned Courses
                      </h4>

                      {expandedLoading ? (
                        <div className="flex items-center gap-2 py-2">
                          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                          <span className="text-sm text-gray-500">
                            Loading courses...
                          </span>
                        </div>
                      ) : expandedTrainer?.courses &&
                        expandedTrainer.courses.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {expandedTrainer.courses.map((ct) => (
                            <span
                              key={ct.id}
                              className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 pl-3 pr-1.5 py-1 rounded-full text-xs"
                            >
                              <span>{ct.course.title}</span>
                              <span className="text-blue-400">
                                ({ct.role})
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUnassignCourse(ct.courseId)
                                }
                                className="ml-0.5 text-blue-400 hover:text-red-600 rounded-full p-0.5"
                                title="Remove assignment"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 mb-3">
                          No courses assigned yet.
                        </p>
                      )}

                      {/* Assign course form */}
                      {(() => {
                        const available = getAvailableCourses();
                        if (available.length === 0) return null;

                        return (
                          <div className="flex flex-wrap items-end gap-2">
                            <div className="min-w-[200px]">
                              <Label className="text-xs">Course</Label>
                              <Select
                                value={selectedCourseId}
                                onValueChange={setSelectedCourseId}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select a course" />
                                </SelectTrigger>
                                <SelectContent>
                                  {available.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                      {c.title}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="min-w-[140px]">
                              <Label className="text-xs">Role</Label>
                              <Select
                                value={selectedRole}
                                onValueChange={setSelectedRole}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {TRAINER_ROLES.map((r) => (
                                    <SelectItem key={r.value} value={r.value}>
                                      {r.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Button
                              size="sm"
                              onClick={handleAssignCourse}
                              disabled={!selectedCourseId || assigning}
                            >
                              {assigning ? "Assigning..." : "Assign"}
                            </Button>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
