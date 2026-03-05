import { z } from "zod";

export const generateTaskSchema = z.object({
  difficulty: z
    .enum(["beginner", "intermediate", "advanced"])
    .optional()
    .default("intermediate"),
});

export const evaluateTaskSchema = z.object({
  task: z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    instructions: z.string().min(1),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]),
    estimatedMinutes: z.number().int().min(1),
    skills: z.array(z.string()),
  }),
  answer: z
    .string()
    .min(10, "Answer must be at least 10 characters")
    .max(5000, "Answer is too long"),
});
