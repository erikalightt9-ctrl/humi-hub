import { z } from "zod";

export const careerReadinessResponseSchema = z.object({
  communication: z.number().int().min(0).max(100),
  accuracy: z.number().int().min(0).max(100),
  speed: z.number().int().min(0).max(100),
  reliability: z.number().int().min(0).max(100),
  technicalSkills: z.number().int().min(0).max(100),
  professionalism: z.number().int().min(0).max(100),
  overallScore: z.number().int().min(0).max(100),
  aiSummary: z.string().min(1),
});
