import type { TrainerTier } from "@prisma/client";

/** Base price for any training program, regardless of trainer tier */
export const BASE_PROGRAM_PRICE = 1500;

/** Additional fee per trainer tier */
export const TRAINER_UPGRADE_FEES: Readonly<Record<TrainerTier, number>> = {
  BASIC: 0,
  PROFESSIONAL: 2000,
  PREMIUM: 6000,
} as const;

/** Total price = base + upgrade fee */
export const TRAINER_TOTAL_PRICES: Readonly<Record<TrainerTier, number>> = {
  BASIC: BASE_PROGRAM_PRICE + TRAINER_UPGRADE_FEES.BASIC,         // ₱1,500
  PROFESSIONAL: BASE_PROGRAM_PRICE + TRAINER_UPGRADE_FEES.PROFESSIONAL, // ₱3,500
  PREMIUM: BASE_PROGRAM_PRICE + TRAINER_UPGRADE_FEES.PREMIUM,       // ₱7,500
} as const;

/** Human-readable tier labels */
export const TRAINER_TIER_LABELS: Readonly<Record<TrainerTier, string>> = {
  BASIC: "Basic Trainer",
  PROFESSIONAL: "Professional Trainer",
  PREMIUM: "Premium Trainer",
} as const;

/** Max session capacity per trainer tier */
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

/**
 * Calculate total enrollment price for a given trainer tier.
 */
export function calculateEnrollmentPrice(tier: TrainerTier): {
  readonly baseProgramPrice: number;
  readonly trainerUpgradeFee: number;
  readonly totalPrice: number;
} {
  const baseProgramPrice = BASE_PROGRAM_PRICE;
  const trainerUpgradeFee = TRAINER_UPGRADE_FEES[tier];
  return {
    baseProgramPrice,
    trainerUpgradeFee,
    totalPrice: baseProgramPrice + trainerUpgradeFee,
  };
}
