import { useState, useEffect } from "react";
import { UseFormReturn, useWatch } from "react-hook-form";
import {
  EMPLOYMENT_STATUS_LABELS,
  TOOL_FAMILIARITY_LABELS,
  type EnrollmentFormData,
} from "@/lib/validations/enrollment.schema";
import { COURSE_TIER_LABELS, COURSE_TIER_COLORS } from "@/lib/constants/course-tiers";
import type { Course, CourseTier } from "@prisma/client";
import { type DiscountConfig, formatDiscountLabel } from "@/lib/types/discount";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ScheduleInfo {
  readonly id: string;
  readonly name: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly daysOfWeek: ReadonlyArray<number>;
}

interface CourseTierPricing {
  readonly priceBasic: number;
  readonly priceProfessional: number;
  readonly priceAdvanced: number;
  readonly finalPriceBasic: number;
  readonly finalPriceProfessional: number;
  readonly finalPriceAdvanced: number;
  readonly discountBasic: DiscountConfig | null;
  readonly discountProfessional: DiscountConfig | null;
  readonly discountAdvanced: DiscountConfig | null;
}

interface StepReviewProps {
  form: UseFormReturn<EnrollmentFormData>;
  courses: Pick<Course, "id" | "title">[];
}

/* ------------------------------------------------------------------ */
/*  Pricing constants                                                  */
/* ------------------------------------------------------------------ */

type TrainerTierValue = "BASIC" | "PROFESSIONAL" | "PREMIUM";

const TRAINER_TIER_LABELS: Readonly<Record<TrainerTierValue, string>> = {
  BASIC: "Basic",
  PROFESSIONAL: "Professional",
  PREMIUM: "Premium",
};

const DEFAULT_UPGRADE_FEES: Readonly<Record<TrainerTierValue, number>> = {
  BASIC: 0,
  PROFESSIONAL: 2000,
  PREMIUM: 6000,
};

const DEFAULT_COURSE_TIER_PRICES: Readonly<Record<CourseTier, number>> = {
  BASIC: 1500,
  PROFESSIONAL: 3500,
  ADVANCED: 5500,
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-2 border-b border-gray-100 last:border-0">
      <dt className="text-sm font-medium text-gray-500 col-span-1">{label}</dt>
      <dd className="text-sm text-gray-900 col-span-2 break-words">{value}</dd>
    </div>
  );
}

function TierBadge({ tier }: { readonly tier: CourseTier }) {
  const colors = COURSE_TIER_COLORS[tier];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}>
      {COURSE_TIER_LABELS[tier]}
    </span>
  );
}

function getTierPrices(
  pricing: CourseTierPricing | null,
  tier: CourseTier,
): { base: number; final: number; discount: DiscountConfig | null } {
  if (!pricing) {
    const p = DEFAULT_COURSE_TIER_PRICES[tier];
    return { base: p, final: p, discount: null };
  }

  const priceMap: Readonly<Record<CourseTier, { base: number; final: number; discount: DiscountConfig | null }>> = {
    BASIC: { base: pricing.priceBasic, final: pricing.finalPriceBasic, discount: pricing.discountBasic },
    PROFESSIONAL: { base: pricing.priceProfessional, final: pricing.finalPriceProfessional, discount: pricing.discountProfessional },
    ADVANCED: { base: pricing.priceAdvanced, final: pricing.finalPriceAdvanced, discount: pricing.discountAdvanced },
  };

  return priceMap[tier];
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function StepReview({ form, courses }: StepReviewProps) {
  const data = useWatch({ control: form.control });
  const course = courses.find((c) => c.id === data.courseId);
  const [trainerName, setTrainerName] = useState<string | null>(null);
  const [trainerTier, setTrainerTier] = useState<TrainerTierValue>("BASIC");
  const [scheduleName, setScheduleName] = useState<string | null>(null);
  const [scheduleInfo, setScheduleInfo] = useState<ScheduleInfo | null>(null);
  const [courseTierPricing, setCourseTierPricing] = useState<CourseTierPricing | null>(null);
  const [trainerUpgradeFees, setTrainerUpgradeFees] = useState<Readonly<Record<TrainerTierValue, number>>>(DEFAULT_UPGRADE_FEES);

  const selectedCourseTier = (data.courseTier as CourseTier) ?? "BASIC";

  // Fetch trainer tier upgrade fees from DB
  useEffect(() => {
    async function fetchTierConfigs() {
      try {
        const res = await fetch("/api/tier-configs");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const fees: Record<TrainerTierValue, number> = { ...DEFAULT_UPGRADE_FEES };
          for (const config of json.data as ReadonlyArray<{ tier: string; upgradeFee: unknown }>) {
            if (config.tier === "BASIC" || config.tier === "PROFESSIONAL" || config.tier === "PREMIUM") {
              fees[config.tier] = typeof config.upgradeFee === "number"
                ? config.upgradeFee
                : Number(config.upgradeFee) || 0;
            }
          }
          setTrainerUpgradeFees(fees);
        }
      } catch {
        /* falls back to DEFAULT_UPGRADE_FEES */
      }
    }
    fetchTierConfigs();
  }, []);

  // Fetch trainer name & tier when trainerId changes
  useEffect(() => {
    if (!data.trainerId) {
      setTrainerName(null);
      setTrainerTier("BASIC");
      return;
    }

    async function fetchTrainer() {
      try {
        const res = await fetch("/api/public/trainers");
        const json = await res.json();
        if (json.success) {
          const found = (json.data as ReadonlyArray<{ id: string; name: string; tier: TrainerTierValue }>).find(
            (t) => t.id === data.trainerId,
          );
          if (found) {
            setTrainerName(found.name);
            setTrainerTier(found.tier);
          }
        }
      } catch {
        /* silent */
      }
    }
    fetchTrainer();
  }, [data.trainerId]);

  // Fetch course tier pricing — always bypass cache so the Review step
  // reflects the latest prices saved by the admin.
  useEffect(() => {
    if (!data.courseId) {
      setCourseTierPricing(null);
      return;
    }

    async function fetchPricing() {
      try {
        const res = await fetch(`/api/courses/${data.courseId}/pricing`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (json.success) {
          setCourseTierPricing(json.data);
        }
      } catch {
        /* silent */
      }
    }
    fetchPricing();
  }, [data.courseId]);

  // Fetch schedule info if one was selected
  useEffect(() => {
    if (!data.scheduleId || !data.courseId) {
      setScheduleName(null);
      setScheduleInfo(null);
      return;
    }

    async function fetchSchedule() {
      try {
        const res = await fetch(`/api/public/schedules?courseId=${data.courseId}`);
        const json = await res.json();
        if (json.success) {
          const found = (json.data as ReadonlyArray<ScheduleInfo>).find(
            (s) => s.id === data.scheduleId,
          );
          if (found) {
            setScheduleName(found.name);
            setScheduleInfo(found);
          }
        }
      } catch {
        /* silent */
      }
    }
    fetchSchedule();
  }, [data.scheduleId, data.courseId]);

  const { base: baseTierPrice, final: finalTierPrice, discount: tierDiscount } =
    getTierPrices(courseTierPricing, selectedCourseTier);

  const hasDiscount = !!tierDiscount && tierDiscount.active && finalTierPrice < baseTierPrice;
  const trainerUpgradeFee = trainerUpgradeFees[trainerTier];
  const totalPrice = finalTierPrice + trainerUpgradeFee;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Review Your Application</h2>
        <p className="text-sm text-gray-500 mt-1">
          Please review all details before submitting.
        </p>
      </div>

      <div className="bg-gray-50 rounded-xl p-5">
        <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">
          Personal Information
        </h3>
        <dl>
          <ReviewRow label="Full Name" value={data.fullName || "\u2014"} />
          <ReviewRow label="Date of Birth" value={data.dateOfBirth || "\u2014"} />
          <ReviewRow label="Email" value={data.email || "\u2014"} />
          <ReviewRow label="Contact No." value={data.contactNumber || "\u2014"} />
          <ReviewRow label="Address" value={data.address || "\u2014"} />
        </dl>
      </div>

      {/* Course & Tier Selection */}
      <div className="bg-gray-50 rounded-xl p-5">
        <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">
          Course &amp; Tier
        </h3>
        <dl>
          <ReviewRow label="Course" value={course?.title ?? "\u2014"} />
          <ReviewRow
            label="Course Tier"
            value={<TierBadge tier={selectedCourseTier} />}
          />
        </dl>
      </div>

      {/* Trainer & Pricing */}
      <div className="bg-gray-50 rounded-xl p-5">
        <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">
          Trainer &amp; Pricing
        </h3>
        <dl>
          <ReviewRow
            label="Trainer"
            value={
              trainerName
                ? `${trainerName} (${TRAINER_TIER_LABELS[trainerTier]})`
                : "Auto-assign Basic Trainer"
            }
          />
          <ReviewRow
            label="Course Tier Price"
            value={
              hasDiscount && tierDiscount ? (
                <span className="flex items-center gap-2 flex-wrap">
                  <span className="line-through text-gray-400">
                    ₱{baseTierPrice.toLocaleString()}
                  </span>
                  <span className="text-xs font-semibold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">
                    {formatDiscountLabel(tierDiscount)}
                  </span>
                  <span className="font-semibold">₱{finalTierPrice.toLocaleString()}</span>
                </span>
              ) : (
                `₱${finalTierPrice.toLocaleString()}`
              )
            }
          />
          {trainerUpgradeFee > 0 && (
            <ReviewRow
              label="Trainer Upgrade"
              value={`₱${trainerUpgradeFee.toLocaleString()}`}
            />
          )}
          <ReviewRow
            label="Total"
            value={
              <span className="font-bold text-green-700">
                {"₱"}{totalPrice.toLocaleString()}
              </span>
            }
          />
        </dl>
      </div>

      {/* Schedule */}
      <div className="bg-gray-50 rounded-xl p-5">
        <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">
          Training Schedule
        </h3>
        <dl>
          <ReviewRow
            label="Session"
            value={scheduleName ?? "To be assigned after enrollment"}
          />
          {scheduleInfo && (
            <>
              <ReviewRow
                label="Dates"
                value={`${new Date(scheduleInfo.startDate).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })} \u2014 ${new Date(scheduleInfo.endDate).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}`}
              />
              <ReviewRow
                label="Time"
                value={`${scheduleInfo.startTime} \u2013 ${scheduleInfo.endTime}`}
              />
            </>
          )}
        </dl>
      </div>

      <div className="bg-gray-50 rounded-xl p-5">
        <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">
          Professional Background
        </h3>
        <dl>
          <ReviewRow label="Education" value={data.educationalBackground || "\u2014"} />
          <ReviewRow label="Work Experience" value={data.workExperience || "\u2014"} />
          <ReviewRow
            label="Employment"
            value={
              data.employmentStatus
                ? EMPLOYMENT_STATUS_LABELS[data.employmentStatus]
                : "\u2014"
            }
          />
          <ReviewRow
            label="Technical Skills"
            value={
              data.technicalSkills?.length
                ? data.technicalSkills.join(", ")
                : "None added"
            }
          />
          <ReviewRow
            label="Tools"
            value={
              data.toolsFamiliarity?.length
                ? data.toolsFamiliarity
                    .map((t) => TOOL_FAMILIARITY_LABELS[t as keyof typeof TOOL_FAMILIARITY_LABELS])
                    .join(", ")
                : "None selected"
            }
          />
        </dl>
      </div>

      <div className="bg-gray-50 rounded-xl p-5">
        <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">
          Personal Statement
        </h3>
        <dl>
          <ReviewRow
            label="Why Enroll"
            value={<span className="whitespace-pre-wrap">{data.whyEnroll || "\u2014"}</span>}
          />
        </dl>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
        By submitting this application you confirm that all information provided is accurate and
        complete. You will receive a confirmation email after submission.
      </div>
    </div>
  );
}
