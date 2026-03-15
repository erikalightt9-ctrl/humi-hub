import { prisma } from "@/lib/prisma";
import type { TrainerTierConfig, TrainerTier } from "@prisma/client";

const TIER_ORDER: TrainerTier[] = ["BASIC", "PROFESSIONAL", "PREMIUM"];

export type { TrainerTierConfig };

export async function getAllTierConfigs(): Promise<TrainerTierConfig[]> {
  const configs = await prisma.trainerTierConfig.findMany();
  return TIER_ORDER.map(
    (tier) =>
      configs.find((c) => c.tier === tier) ?? {
        tier,
        label: tier.charAt(0) + tier.slice(1).toLowerCase() + " Trainer",
        upgradeFee: { toNumber: () => 0 } as TrainerTierConfig["upgradeFee"],
        baseProgramPrice: { toNumber: () => 1500 } as TrainerTierConfig["baseProgramPrice"],
        benefits: [],
        maxCapacity: 15,
        revenueSharePct: 70,
        isActive: true,
        updatedAt: new Date(),
      }
  );
}

export async function getTierConfig(tier: TrainerTier): Promise<TrainerTierConfig | null> {
  return prisma.trainerTierConfig.findUnique({ where: { tier } });
}

export interface UpsertTierConfigData {
  label: string;
  upgradeFee: number;
  baseProgramPrice: number;
  benefits: string[];
  maxCapacity: number;
  revenueSharePct: number;
  isActive: boolean;
}

export async function upsertTierConfig(
  tier: TrainerTier,
  data: UpsertTierConfigData
): Promise<TrainerTierConfig> {
  return prisma.trainerTierConfig.upsert({
    where: { tier },
    create: { tier, ...data },
    update: { ...data },
  });
}
