import { z } from "zod";

export const trainerTierConfigSchema = z.object({
  label: z.string().min(1, "Label is required").max(50),
  upgradeFee: z.number().min(0, "Upgrade fee cannot be negative"),
  baseProgramPrice: z.number().min(0, "Base program price cannot be negative"),
  benefits: z.array(z.string().min(1).max(100)).max(10),
  maxCapacity: z.number().int().min(1).max(100),
  revenueSharePct: z.number().int().min(1).max(100),
  isActive: z.boolean(),
});

export type TrainerTierConfigInput = z.infer<typeof trainerTierConfigSchema>;
