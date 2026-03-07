import { z } from "zod";

export const generateScenarioSchema = z.object({
  scenarioType: z.string().min(1, "Scenario type is required"),
});

export const evaluateEmailSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  email: z
    .string()
    .min(50, "Email must be at least 50 characters")
    .max(5000, "Email is too long"),
});

export type GenerateScenarioInput = z.infer<typeof generateScenarioSchema>;
export type EvaluateEmailInput = z.infer<typeof evaluateEmailSchema>;
