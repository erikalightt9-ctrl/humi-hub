import { z } from "zod";

export const refreshControlTowerSchema = z.object({
  forceRefresh: z.boolean().optional().default(true),
});
