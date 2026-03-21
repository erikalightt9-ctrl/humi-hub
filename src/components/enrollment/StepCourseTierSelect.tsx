"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { CheckCircle, Loader2, Star, Zap, Crown } from "lucide-react";
import type { EnrollmentFormData } from "@/lib/validations/enrollment.schema";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type CourseTierValue = "BASIC" | "PROFESSIONAL" | "ADVANCED";

interface CoursePricing {
  readonly priceBasic: number;
  readonly priceProfessional: number;
  readonly priceAdvanced: number;
  readonly featuresBasic: readonly string[];
  readonly featuresProfessional: readonly string[];
  readonly featuresAdvanced: readonly string[];
  readonly popularTier: string | null;
}

interface StepCourseTierSelectProps {
  readonly form: UseFormReturn<EnrollmentFormData>;
  readonly courseId: string;
}

/* ------------------------------------------------------------------ */
/*  Constants — UI-only config (no pricing or features)               */
/* ------------------------------------------------------------------ */

const TIER_UI: Readonly<
  Record<
    CourseTierValue,
    {
      readonly label: string;
      readonly bg: string;
      readonly border: string;
      readonly selectedBorder: string;
      readonly badge: string;
      readonly icon: typeof Star;
      readonly priceKey: keyof Pick<CoursePricing, "priceBasic" | "priceProfessional" | "priceAdvanced">;
      readonly featuresKey: keyof Pick<CoursePricing, "featuresBasic" | "featuresProfessional" | "featuresAdvanced">;
    }
  >
> = {
  BASIC: {
    label: "Basic",
    bg: "bg-white",
    border: "border-gray-200",
    selectedBorder: "border-gray-500 ring-2 ring-gray-200",
    badge: "bg-gray-100 text-gray-700",
    icon: Star,
    priceKey: "priceBasic",
    featuresKey: "featuresBasic",
  },
  PROFESSIONAL: {
    label: "Professional",
    bg: "bg-blue-50/30",
    border: "border-blue-200",
    selectedBorder: "border-blue-500 ring-2 ring-blue-200",
    badge: "bg-blue-100 text-blue-700",
    icon: Zap,
    priceKey: "priceProfessional",
    featuresKey: "featuresProfessional",
  },
  ADVANCED: {
    label: "Advanced",
    bg: "bg-purple-50/30",
    border: "border-purple-200",
    selectedBorder: "border-purple-500 ring-2 ring-purple-200",
    badge: "bg-purple-100 text-purple-700",
    icon: Crown,
    priceKey: "priceAdvanced",
    featuresKey: "featuresAdvanced",
  },
};

const TIER_ORDER: readonly CourseTierValue[] = ["BASIC", "PROFESSIONAL", "ADVANCED"];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const POLL_INTERVAL_MS = 10_000; // re-fetch every 10 s while visible

export function StepCourseTierSelect({ form, courseId }: StepCourseTierSelectProps) {
  const [pricing, setPricing] = useState<CoursePricing | null>(null);
  const [loading, setLoading] = useState(true);
  const selectedTier = form.watch("courseTier") as CourseTierValue | undefined;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchPricing = useCallback(async (isInitial = false) => {
    if (!courseId) return;
    if (isInitial) setLoading(true);
    try {
      // cache: "no-store" bypasses the browser cache so we always get the
      // latest price that was saved by the admin.
      const res = await fetch(`/api/courses/${courseId}/pricing`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.success) setPricing(data.data);
    } catch {
      // silently ignore network errors on background polls
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [courseId]);

  // Initial fetch + start polling while this step is mounted
  useEffect(() => {
    fetchPricing(true);
    intervalRef.current = setInterval(() => fetchPricing(false), POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchPricing]);

  function selectTier(tier: CourseTierValue) {
    form.setValue("courseTier", tier, { shouldValidate: true });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        <span className="ml-2 text-sm text-gray-500">Loading tier options...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Select Your Training Tier</h3>
        <p className="text-sm text-gray-500 mt-1">
          Choose the level that best fits your learning goals. You can always upgrade later.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TIER_ORDER.map((tierKey) => {
          const ui = TIER_UI[tierKey];
          const isSelected = selectedTier === tierKey;
          const isPopular = pricing?.popularTier === tierKey;
          const Icon = ui.icon;
          const tierPrice = pricing ? pricing[ui.priceKey] : 0;
          const features: readonly string[] = pricing ? pricing[ui.featuresKey] : [];

          return (
            <button
              key={tierKey}
              type="button"
              onClick={() => selectTier(tierKey)}
              className={`relative text-left rounded-xl border-2 p-5 transition-all ${ui.bg} ${
                isSelected ? ui.selectedBorder : `${ui.border} hover:shadow-md`
              }`}
            >
              {/* Most Popular badge */}
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Selected checkmark */}
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              )}

              {/* Tier badge + icon */}
              <div className="flex items-center gap-2 mb-3">
                <Icon className="h-5 w-5 text-gray-600" />
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ui.badge}`}>
                  {ui.label}
                </span>
              </div>

              {/* Price */}
              <div className="mb-3">
                <span className="text-2xl font-bold text-gray-900">
                  ₱{tierPrice.toLocaleString()}
                </span>
              </div>

              {/* Features from backend */}
              <ul className="space-y-1.5">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-xs text-gray-600">
                    <span className="text-green-500 mt-0.5">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* Select button */}
              <div
                className={`mt-4 text-center py-2 rounded-lg text-sm font-medium transition ${
                  isSelected
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {isSelected ? "Selected" : "Select Plan"}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
