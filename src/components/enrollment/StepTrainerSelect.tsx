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

type TierValue = "BASIC" | "PROFESSIONAL" | "PREMIUM";

interface TierConfigEntry {
  readonly tier: TierValue;
  readonly label: string;
  readonly upgradeFee: number;
  readonly baseProgramPrice: number;
  readonly bg: string;
  readonly text: string;
  readonly border: string;
  readonly ring: string;
}

interface PublicTrainer {
  readonly id: string;
  readonly name: string;
  readonly tier: TierValue;
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
/*  Style map (UI only — not business logic)                          */
/* ------------------------------------------------------------------ */

const TIER_STYLES: Readonly<Record<TierValue, Pick<TierConfigEntry, "bg" | "text" | "border" | "ring">>> = {
  BASIC:        { bg: "bg-gray-50",  text: "text-gray-700",  border: "border-gray-200",  ring: "ring-gray-400"  },
  PROFESSIONAL: { bg: "bg-blue-50",  text: "text-blue-700",  border: "border-blue-200",  ring: "ring-blue-500"  },
  PREMIUM:      { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", ring: "ring-amber-500" },
};

const DEFAULT_TIER_CONFIG: Readonly<Record<TierValue, TierConfigEntry>> = {
  BASIC:        { tier: "BASIC",        label: "Basic",        upgradeFee: 0,    baseProgramPrice: 1500, ...TIER_STYLES.BASIC },
  PROFESSIONAL: { tier: "PROFESSIONAL", label: "Professional", upgradeFee: 2000, baseProgramPrice: 1500, ...TIER_STYLES.PROFESSIONAL },
  PREMIUM:      { tier: "PREMIUM",      label: "Premium",      upgradeFee: 6000, baseProgramPrice: 1500, ...TIER_STYLES.PREMIUM },
};

function toNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (v && typeof (v as { toNumber?: () => number }).toNumber === "function") {
    return (v as { toNumber: () => number }).toNumber();
  }
  return Number(v) || 0;
}

function buildTierConfig(raw: { tier: string; label: string; upgradeFee: unknown; baseProgramPrice: unknown }[]): Record<TierValue, TierConfigEntry> {
  const result = { ...DEFAULT_TIER_CONFIG };
  for (const r of raw) {
    const tier = r.tier as TierValue;
    if (TIER_STYLES[tier]) {
      result[tier] = {
        tier,
        label: r.label || tier,
        upgradeFee: toNumber(r.upgradeFee),
        baseProgramPrice: toNumber(r.baseProgramPrice),
        ...TIER_STYLES[tier],
      };
    }
  }
  return result;
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
  tierConfig,
}: {
  readonly trainer: PublicTrainer;
  readonly isSelected: boolean;
  readonly isExpanded: boolean;
  readonly onSelect: () => void;
  readonly onToggleExpand: () => void;
  readonly tierConfig: Record<TierValue, TierConfigEntry>;
}) {
  const config = tierConfig[trainer.tier] ?? DEFAULT_TIER_CONFIG[trainer.tier];
  const totalPrice = config.baseProgramPrice + config.upgradeFee;
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

        {/* Price */}
        <div className="text-right shrink-0">
          <p className="text-lg font-bold text-gray-900">
            ₱{totalPrice.toLocaleString()}
          </p>
          {config.upgradeFee > 0 && (
            <p className="text-[10px] text-gray-400">
              ₱{config.baseProgramPrice.toLocaleString()} + ₱{config.upgradeFee.toLocaleString()}
            </p>
          )}
        </div>

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

          {/* Pricing breakdown */}
          <div className={`rounded-lg p-3 ${config.bg}`}>
            <h4 className={`text-xs font-semibold ${config.text} mb-2`}>
              Pricing Breakdown
            </h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Base Program Fee</span>
                <span>₱{config.baseProgramPrice.toLocaleString()}</span>
              </div>
              {config.upgradeFee > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>{config.label} Tier Upgrade</span>
                  <span>₱{config.upgradeFee.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-200">
                <span>Total</span>
                <span>₱{totalPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>

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
  const [tierConfig, setTierConfig] = useState<Record<TierValue, TierConfigEntry>>(DEFAULT_TIER_CONFIG);
  const [loading, setLoading] = useState(true);
  const [expandedTrainerId, setExpandedTrainerId] = useState<string | null>(null);

  const selectedTrainerId = form.watch("trainerId");

  useEffect(() => {
    async function fetchData() {
      try {
        const [trainersRes, tierRes] = await Promise.all([
          fetch("/api/public/trainers"),
          fetch("/api/tier-configs"),
        ]);
        const [trainersJson, tierJson] = await Promise.all([
          trainersRes.json(),
          tierRes.json(),
        ]);
        if (trainersJson.success) setTrainers(trainersJson.data);
        if (tierJson.success && Array.isArray(tierJson.data)) {
          setTierConfig(buildTierConfig(tierJson.data));
        }
      } catch {
        // Silently fail — defaults will be used
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  function handleSelectTrainer(trainerId: string | null) {
    form.setValue("trainerId", trainerId ?? undefined, {
      shouldDirty: true,
    });
  }

  function handleToggleExpand(trainerId: string) {
    setExpandedTrainerId((prev) => (prev === trainerId ? null : trainerId));
  }

  // Group trainers by tier
  const premiumTrainers = trainers.filter((t) => t.tier === "PREMIUM");
  const professionalTrainers = trainers.filter(
    (t) => t.tier === "PROFESSIONAL",
  );
  const basicTrainers = trainers.filter((t) => t.tier === "BASIC");

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

      {/* Premium trainers */}
      {premiumTrainers.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-1">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            Premium Trainers
          </h3>
          <div className="space-y-2">
            {premiumTrainers.map((t) => (
              <TrainerCard
                key={t.id}
                trainer={t}
                isSelected={selectedTrainerId === t.id}
                isExpanded={expandedTrainerId === t.id}
                onSelect={() => handleSelectTrainer(t.id)}
                onToggleExpand={() => handleToggleExpand(t.id)}
                tierConfig={tierConfig}
              />
            ))}
          </div>
        </div>
      )}

      {/* Professional trainers */}
      {professionalTrainers.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-blue-700 mb-2">
            Professional Trainers
          </h3>
          <div className="space-y-2">
            {professionalTrainers.map((t) => (
              <TrainerCard
                key={t.id}
                trainer={t}
                isSelected={selectedTrainerId === t.id}
                isExpanded={expandedTrainerId === t.id}
                onSelect={() => handleSelectTrainer(t.id)}
                onToggleExpand={() => handleToggleExpand(t.id)}
                tierConfig={tierConfig}
              />
            ))}
          </div>
        </div>
      )}

      {/* Basic trainers */}
      {basicTrainers.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Basic Trainers
          </h3>
          <div className="space-y-2">
            {basicTrainers.map((t) => (
              <TrainerCard
                key={t.id}
                trainer={t}
                isSelected={selectedTrainerId === t.id}
                isExpanded={expandedTrainerId === t.id}
                onSelect={() => handleSelectTrainer(t.id)}
                onToggleExpand={() => handleToggleExpand(t.id)}
                tierConfig={tierConfig}
              />
            ))}
          </div>
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
