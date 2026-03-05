import { z } from "zod";

export const refreshInsightsSchema = z.object({
  forceRefresh: z.boolean().optional().default(true),
});
