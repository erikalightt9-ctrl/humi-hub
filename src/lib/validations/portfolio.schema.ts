import { z } from "zod";

export const portfolioVisibilitySchema = z.object({
  isPublic: z.boolean(),
});

export type PortfolioVisibilityInput = z.infer<typeof portfolioVisibilitySchema>;
