import { z } from "zod";

export const submissionIdParamSchema = z
  .string()
  .min(1, "Submission ID is required")
  .max(100, "Invalid submission ID");

export const aiAssessmentResultSchema = z.object({
  score: z.number().int().min(0).max(100),
  feedback: z.string().min(1),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  skillsAssessed: z.array(z.string()),
});
