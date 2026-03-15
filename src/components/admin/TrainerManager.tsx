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
  Star,
  Users,
  Award,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrainerForm } from "@/components/admin/TrainerForm";
import { TrainerAccessPanel } from "@/components/admin/TrainerAccessPanel";
import { TrainerAvailabilityEditor } from "@/components/admin/TrainerAvailabilityEditor";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type TierValue = "BASIC" | "PROFESSIONAL" | "PREMIUM";

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
  readonly tier: TierValue;
  readonly credentials: string | null;
  readonly certifications: ReadonlyArray<string>;
  readonly industryExperience: string | null;
  readonly yearsOfExperience: number;
  readonly averageRating: string | number | null;
  readonly totalRatings: number;
  readonly accessGranted: boolean;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly _count?: {
    readonly courses: number;
    readonly students: number;
  };
  readonly courses?: ReadonlyArray<CourseAssignment>;
}

interface Course {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly isActive: boolean;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const TIER_BADGE_STYLES: Readonly<
  Record<TierValue, { readonly bg: string; readonly text: string }>
> = {
  BASIC: { bg: "bg-gray-100", text: "text-gray-700" },
  PROFESSIONAL: { bg: "bg-blue-100", text: "text-blue-700" },
  PREMIUM: { bg: "bg-amber-100", text: "text-amber-700" },
};

const TIER_LABELS: Readonly<Record<TierValue, string>> = {
  BASIC: "Basic",
  PROFESSIONAL: "Professional",
  PREMIUM: "Premium",
};

const TRAINER_ROLES = [
  { value: "instructor", label: "Instructor" },
  { value: "assistant", label: "Assistant" },
  { value: "mentor", label: "Mentor" },
  { value: "guest", label: "Guest Lecturer" },
] as const;

/* ------------------------------------------------------------------ */
/*  Star Rating Display                                                */
/* ------------------------------------------------------------------ */

function StarRating({
  rating,
  count,
}: {
  readonly rating: string | number | null;
  readonly count: number;
}) {
  const numRating = rating ? Number(rating) : 0;
  if (count === 0) {
    return (
      <span className="text-xs text-gray-400 inline-flex items-center gap-1">
        <Star className="h-3 w-3" />
        No ratings
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
      <span className="font-medium text-gray-700">
        {numRating.toFixed(1)}
      </span>
      <span className="text-gray-400">({count})</span>
    </span>
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
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);

  // Expanded trainer for details + course assignments
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedTrainer, setExpandedTrainer] = useState<Trainer | null>(null);
  const [expandedLoading, setExpandedLoading] = useState(false);
  const [expandedAvailability, setExpandedAvailability] = useState<
    ReadonlyArray<{ id: string; dayOfWeek: number; startTime: string; endTime: string }>
  >([]);

  // Course assignment form
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedRole, setSelectedRole] = useState("instructor");
  const [assigning, setAssigning] = useState(false);

  /* ---------------------------------------------------------------- */
  /*  Data fetching                                                    */
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
      if (json.success) setCourses(json.data);
    } catch {
      /* Courses are supplementary */
    }
  }, []);

  useEffect(() => {
    fetchTrainers();
    fetchCourses();
  }, [fetchTrainers, fetchCourses]);

  const fetchTrainerDetail = useCallback(async (id: string) => {
    setExpandedLoading(true);
    try {
      const [trainerRes, availRes] = await Promise.all([
        fetch(`/api/admin/trainers/${id}`),
        fetch(`/api/admin/trainers/${id}/availability`),
      ]);
      const [trainerJson, availJson] = await Promise.all([
        trainerRes.json(),
        availRes.json(),
      ]);
      if (trainerJson.success) setExpandedTrainer(trainerJson.data);
      if (availJson.success) setExpandedAvailability(availJson.data.slots ?? []);
    } catch {
      /* silent */
    } finally {
      setExpandedLoading(false);
    }
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Form helpers                                                     */
  /* ---------------------------------------------------------------- */

  function openCreateForm() {
    setEditingTrainer(null);
    setShowForm(true);
  }

  function openEditForm(trainer: Trainer) {
    setEditingTrainer(trainer);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingTrainer(null);
  }

  async function handleFormSave() {
    closeForm();
    await fetchTrainers();
  }

  /* ---------------------------------------------------------------- */
  /*  Toggle expanded                                                  */
  /* ---------------------------------------------------------------- */

  function toggleExpand(trainerId: string) {
    if (expandedId === trainerId) {
      setExpandedId(null);
      setExpandedTrainer(null);
      setExpandedAvailability([]);
    } else {
      setExpandedId(trainerId);
      setSelectedCourseId("");
      setSelectedRole("instructor");
      fetchTrainerDetail(trainerId);
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
    if (
      !confirm("Deactivate this trainer? They will be marked as inactive.")
    ) {
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

  function getAvailableCourses(): ReadonlyArray<Course> {
    if (!expandedTrainer?.courses) return courses;
    const assignedIds = new Set(
      expandedTrainer.courses.map((ct) => ct.courseId),
    );
    return courses.filter((c) => !assignedIds.has(c.id));
  }

  /* ---------------------------------------------------------------- */
  /*  Access update callback                                           */
  /* ---------------------------------------------------------------- */

  async function handleAccessUpdate() {
    await fetchTrainers();
    if (expandedId) {
      await fetchTrainerDetail(expandedId);
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
        <TrainerForm
          editingTrainer={editingTrainer}
          onSave={handleFormSave}
          onCancel={closeForm}
        />
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
            Add trainers to manage instructor assignments, tier levels, and
            portal access.
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
            const tierStyle = TIER_BADGE_STYLES[trainer.tier] ?? TIER_BADGE_STYLES.BASIC;

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
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {trainer.name}
                        </h3>
                        {/* Tier badge */}
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full shrink-0 font-medium ${tierStyle.bg} ${tierStyle.text}`}
                        >
                          {TIER_LABELS[trainer.tier] ?? "Basic"}
                        </span>
                        {/* Active/Inactive badge */}
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                            trainer.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {trainer.isActive ? "Active" : "Inactive"}
                        </span>
                        {/* Access badge */}
                        {trainer.accessGranted && (
                          <span className="text-xs px-2 py-0.5 rounded-full shrink-0 bg-purple-100 text-purple-700">
                            Portal Access
                          </span>
                        )}
                      </div>

                      {/* Contact + stats row */}
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
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {trainer._count?.students ?? 0} student
                          {(trainer._count?.students ?? 0) !== 1 ? "s" : ""}
                        </span>
                        <StarRating
                          rating={trainer.averageRating}
                          count={trainer.totalRatings}
                        />
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
                      title={
                        trainer.isActive ? "Deactivate" : "Activate"
                      }
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

                {/* ─── Expanded section ─── */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-5">
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

                    {/* Professional details grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {trainer.credentials && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Award className="h-3 w-3" />
                            Credentials / Degrees
                          </h4>
                          <p className="text-sm text-gray-600 whitespace-pre-line">
                            {trainer.credentials}
                          </p>
                        </div>
                      )}

                      {trainer.industryExperience && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            Industry Experience
                          </h4>
                          <p className="text-sm text-gray-600 whitespace-pre-line">
                            {trainer.industryExperience}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Certifications */}
                    {trainer.certifications.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                          Certifications
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {trainer.certifications.map((cert) => (
                            <span
                              key={cert}
                              className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-xs"
                            >
                              {cert}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Years of experience */}
                    {trainer.yearsOfExperience > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                          Years of Experience
                        </h4>
                        <p className="text-sm text-gray-600">
                          {trainer.yearsOfExperience} year
                          {trainer.yearsOfExperience !== 1 ? "s" : ""}
                        </p>
                      </div>
                    )}

                    {/* Availability Editor */}
                    <div>
                      <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                        Weekly Availability
                      </h4>
                      {expandedLoading ? (
                        <p className="text-sm text-gray-400">Loading…</p>
                      ) : (
                        <TrainerAvailabilityEditor
                          trainerId={trainer.id}
                          initialSlots={expandedAvailability}
                        />
                      )}
                    </div>

                    {/* Portal Access Panel */}
                    <TrainerAccessPanel
                      trainerId={trainer.id}
                      trainerName={trainer.name}
                      trainerEmail={trainer.email}
                      accessGranted={trainer.accessGranted}
                      isActive={trainer.isActive}
                      onUpdate={handleAccessUpdate}
                    />

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
                                    <SelectItem
                                      key={r.value}
                                      value={r.value}
                                    >
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
