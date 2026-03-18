"use client";

import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import {
  Star,
  UserCog,
  Award,
  Users,
  Loader2,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Briefcase,
  BadgeCheck,
} from "lucide-react";
import type { EnrollmentFormData } from "@/lib/validations/enrollment.schema";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PublicTrainer {
  readonly id: string;
  readonly name: string;
  readonly photoUrl: string | null;
  readonly bio: string | null;
  readonly specializations: ReadonlyArray<string>;
  readonly credentials: string | null;
  readonly certifications: ReadonlyArray<string>;
  readonly industryExperience: string | null;
  readonly yearsOfExperience: number;
  readonly averageRating: string | number | null;
  readonly totalRatings: number;
  readonly studentsTrainedCount: number;
}

interface StepTrainerSelectProps {
  readonly form: UseFormReturn<EnrollmentFormData>;
}

/* ------------------------------------------------------------------ */
/*  TrainerCard                                                        */
/* ------------------------------------------------------------------ */

function TrainerCard({
  trainer,
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpand,
}: {
  readonly trainer: PublicTrainer;
  readonly isSelected: boolean;
  readonly isExpanded: boolean;
  readonly onSelect: () => void;
  readonly onToggleExpand: () => void;
}) {
  const numRating = trainer.averageRating ? Number(trainer.averageRating) : 0;

  return (
    <div
      className={`relative w-full text-left rounded-xl border-2 transition-all ${
        isSelected
          ? "border-blue-300 ring-2 ring-blue-400 shadow-md"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      {/* Compact row — photo, name. Click name to expand. */}
      <div className="flex items-center gap-3 p-4">
        {/* Photo */}
        {trainer.photoUrl ? (
          <img
            src={trainer.photoUrl}
            alt={trainer.name}
            className="h-12 w-12 rounded-full object-cover border-2 border-gray-200 shrink-0"
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0 border-2 border-gray-200">
            <UserCog className="h-5 w-5 text-blue-400" />
          </div>
        )}

        {/* Name — clickable to expand */}
        <button
          type="button"
          onClick={onToggleExpand}
          className="flex-1 min-w-0 text-left group"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
              {trainer.name}
            </span>
            {isExpanded ? (
              <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            )}
          </div>
          {!isExpanded && (
            <p className="text-[11px] text-blue-500 mt-0.5">
              Tap to view profile
            </p>
          )}
        </button>

        {/* Selected indicator */}
        {isSelected && (
          <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
        )}
      </div>

      {/* Expanded profile details */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100">
          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 pt-3">
            {trainer.totalRatings > 0 && (
              <span className="inline-flex items-center gap-0.5">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {numRating.toFixed(1)} ({trainer.totalRatings})
              </span>
            )}
            {trainer.yearsOfExperience > 0 && (
              <span className="inline-flex items-center gap-0.5">
                <Award className="h-3 w-3" />
                {trainer.yearsOfExperience}yr exp.
              </span>
            )}
            {trainer.studentsTrainedCount > 0 && (
              <span className="inline-flex items-center gap-0.5">
                <Users className="h-3 w-3" />
                {trainer.studentsTrainedCount} students
              </span>
            )}
          </div>

          {/* Full bio */}
          {trainer.bio && (
            <div>
              <h4 className="text-xs font-semibold text-gray-700 mb-1">About</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                {trainer.bio}
              </p>
            </div>
          )}

          {/* Credentials */}
          {trainer.credentials && (
            <div>
              <h4 className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <BadgeCheck className="h-3.5 w-3.5 text-blue-500" />
                Credentials
              </h4>
              <p className="text-sm text-gray-600">{trainer.credentials}</p>
            </div>
          )}

          {/* Industry Experience */}
          {trainer.industryExperience && (
            <div>
              <h4 className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5 text-green-500" />
                Industry Experience
              </h4>
              <p className="text-sm text-gray-600">
                {trainer.industryExperience}
              </p>
            </div>
          )}

          {/* All specializations */}
          {trainer.specializations.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-700 mb-1.5">
                Specializations
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {trainer.specializations.map((spec) => (
                  <span
                    key={spec}
                    className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {trainer.certifications.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                <Award className="h-3.5 w-3.5 text-amber-500" />
                Certifications
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {trainer.certifications.map((cert) => (
                  <span
                    key={cert}
                    className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full text-xs"
                  >
                    {cert}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Select button */}
          <button
            type="button"
            onClick={onSelect}
            className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              isSelected
                ? "bg-green-600 text-white"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isSelected ? "Selected" : `Select ${trainer.name}`}
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Default Option (Auto-assign)                                       */
/* ------------------------------------------------------------------ */

function AutoAssignCard({
  isSelected,
  onSelect,
}: {
  readonly isSelected: boolean;
  readonly onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative w-full text-left rounded-xl border-2 p-4 transition-all hover:shadow-md ${
        isSelected
          ? "border-green-300 ring-2 ring-green-400 shadow-md bg-green-50"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      {isSelected && (
        <div className="absolute top-3 right-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center shrink-0 border-2 border-green-200">
          <UserCog className="h-6 w-6 text-green-600" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900 text-sm">
            Auto-Assign Trainer
          </p>
          <p className="text-xs text-gray-500">
            We&apos;ll assign an available trainer for you
          </p>
        </div>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function StepTrainerSelect({ form }: StepTrainerSelectProps) {
  const [trainers, setTrainers] = useState<ReadonlyArray<PublicTrainer>>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTrainerId, setExpandedTrainerId] = useState<string | null>(null);

  const selectedTrainerId = form.watch("trainerId");

  useEffect(() => {
    async function fetchTrainers() {
      try {
        const res = await fetch("/api/public/trainers");
        const json = await res.json();
        if (json.success) {
          setTrainers(json.data);
        }
      } catch {
        // Silently fail — auto-assign will be the default
      } finally {
        setLoading(false);
      }
    }
    fetchTrainers();
  }, []);

  function handleSelectTrainer(trainerId: string | null) {
    form.setValue("trainerId", trainerId ?? undefined, {
      shouldDirty: true,
    });
  }

  function handleToggleExpand(trainerId: string) {
    setExpandedTrainerId((prev) => (prev === trainerId ? null : trainerId));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        <span className="ml-2 text-sm text-gray-500">
          Loading available trainers...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          Choose Your Trainer
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Select a trainer or let us auto-assign one for you.
        </p>
      </div>

      {/* Auto-assign option */}
      <AutoAssignCard
        isSelected={!selectedTrainerId}
        onSelect={() => handleSelectTrainer(null)}
      />

      {/* Trainers list */}
      {trainers.length > 0 && (
        <div className="space-y-2">
          {trainers.map((t) => (
            <TrainerCard
              key={t.id}
              trainer={t}
              isSelected={selectedTrainerId === t.id}
              isExpanded={expandedTrainerId === t.id}
              onSelect={() => handleSelectTrainer(t.id)}
              onToggleExpand={() => handleToggleExpand(t.id)}
            />
          ))}
        </div>
      )}

      {trainers.length === 0 && (
        <div className="text-center py-6 text-sm text-gray-500">
          No trainers are currently available. A trainer will be auto-assigned
          after enrollment.
        </div>
      )}
    </div>
  );
}
