import { z } from "zod";

export const startInterviewSchema = z.object({
  action: z.literal("start"),
  role: z.string().min(1, "Role is required"),
  courseSlug: z.string().optional(),
});

export const answerQuestionSchema = z.object({
  action: z.literal("answer"),
  sessionId: z.string().min(1, "Session ID is required"),
  answer: z
    .string()
    .min(10, "Answer must be at least 10 characters")
    .max(3000, "Answer is too long"),
});

export const endInterviewSchema = z.object({
  action: z.literal("end"),
  sessionId: z.string().min(1, "Session ID is required"),
});
