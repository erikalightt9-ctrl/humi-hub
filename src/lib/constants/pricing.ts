import type { TrainerTier } from "@prisma/client";

/** Base price for any training program */
export const BASE_PROGRAM_PRICE = 1500;

/** Human-readable tier labels */
export const TRAINER_TIER_LABELS: Readonly<Record<TrainerTier, string>> = {
  BASIC: "Basic Trainer",
  PROFESSIONAL: "Professional Trainer",
  PREMIUM: "Premium Trainer",
} as const;

/** Max session capacity per trainer tier (fallback — DB value is authoritative) */
export const TIER_MAX_CAPACITY: Readonly<Record<TrainerTier, number>> = {
  BASIC: 15,
  PROFESSIONAL: 20,
  PREMIUM: 25,
} as const;

/** Tier badge colors for UI */
export const TRAINER_TIER_COLORS: Readonly<
  Record<TrainerTier, { readonly bg: string; readonly text: string; readonly border: string }>
> = {
  BASIC: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" },
  PROFESSIONAL: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300" },
  PREMIUM: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300" },
} as const;
