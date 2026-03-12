import { useState, useEffect } from "react";
import { UseFormReturn, useWatch } from "react-hook-form";
import {
  EMPLOYMENT_STATUS_LABELS,
  TOOL_FAMILIARITY_LABELS,
  type EnrollmentFormData,
} from "@/lib/validations/enrollment.schema";
import type { Course } from "@prisma/client";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type TierValue = "BASIC" | "PROFESSIONAL" | "PREMIUM";

interface PublicTrainer {
  readonly id: string;
  readonly name: string;
  readonly tier: TierValue;
  readonly photoUrl: string | null;
}

interface ScheduleInfo {
  readonly id: string;
  readonly name: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly daysOfWeek: ReadonlyArray<number>;
}

interface StepReviewProps {
  form: UseFormReturn<EnrollmentFormData>;
  courses: Pick<Course, "id" | "title">[];
}

/* ------------------------------------------------------------------ */
/*  Pricing constants (mirrored from server)                           */
/* ------------------------------------------------------------------ */

const TIER_LABELS: Readonly<Record<TierValue, string>> = {
  BASIC: "Basic",
  PROFESSIONAL: "Professional",
  PREMIUM: "Premium",
};

const TIER_PRICES: Readonly<Record<TierValue, { readonly upgrade: number; readonly total: number }>> = {
  BASIC: { upgrade: 0, total: 1500 },
  PROFESSIONAL: { upgrade: 2000, total: 3500 },
  PREMIUM: { upgrade: 6000, total: 7500 },
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

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function StepReview({ form, courses }: StepReviewProps) {
  const data = useWatch({ control: form.control });
  const course = courses.find((c) => c.id === data.courseId);
  const [trainerName, setTrainerName] = useState<string | null>(null);
  const [trainerTier, setTrainerTier] = useState<TierValue>("BASIC");
  const [scheduleName, setScheduleName] = useState<string | null>(null);
  const [scheduleInfo, setScheduleInfo] = useState<ScheduleInfo | null>(null);

  // Fetch trainer name if one was selected
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
          const found = (json.data as ReadonlyArray<PublicTrainer>).find(
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

  const pricing = TIER_PRICES[trainerTier];

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
          <ReviewRow label="Full Name" value={data.fullName || "—"} />
          <ReviewRow label="Date of Birth" value={data.dateOfBirth || "—"} />
          <ReviewRow label="Email" value={data.email || "—"} />
          <ReviewRow label="Contact No." value={data.contactNumber || "—"} />
          <ReviewRow label="Address" value={data.address || "—"} />
        </dl>
      </div>

      {/* Trainer & Pricing */}
      <div className="bg-gray-50 rounded-xl p-5">
        <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">
          Trainer & Pricing
        </h3>
        <dl>
          <ReviewRow
            label="Trainer"
            value={
              trainerName
                ? `${trainerName} (${TIER_LABELS[trainerTier]})`
                : "Auto-assign Basic Trainer"
            }
          />
          <ReviewRow
            label="Base Price"
            value={`₱1,500`}
          />
          {pricing.upgrade > 0 && (
            <ReviewRow
              label="Tier Upgrade"
              value={`₱${pricing.upgrade.toLocaleString()}`}
            />
          )}
          <ReviewRow
            label="Total"
            value={
              <span className="font-bold text-green-700">
                ₱{pricing.total.toLocaleString()}
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
                value={`${new Date(scheduleInfo.startDate).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })} — ${new Date(scheduleInfo.endDate).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}`}
              />
              <ReviewRow
                label="Time"
                value={`${scheduleInfo.startTime} – ${scheduleInfo.endTime}`}
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
          <ReviewRow label="Education" value={data.educationalBackground || "—"} />
          <ReviewRow label="Work Experience" value={data.workExperience || "—"} />
          <ReviewRow
            label="Employment"
            value={
              data.employmentStatus
                ? EMPLOYMENT_STATUS_LABELS[data.employmentStatus]
                : "—"
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
          Personal Statement & Course
        </h3>
        <dl>
          <ReviewRow
            label="Why Enroll"
            value={<span className="whitespace-pre-wrap">{data.whyEnroll || "—"}</span>}
          />
          <ReviewRow
            label="Course Selected"
            value={course?.title ?? "—"}
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
