import { z } from "zod";

export const fullAssessmentSchema = z.object({
  action: z.literal("full-assessment"),
});
