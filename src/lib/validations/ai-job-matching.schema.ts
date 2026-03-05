import { z } from "zod";

/* ------------------------------------------------------------------ */
/*  Course slug enum values                                            */
/* ------------------------------------------------------------------ */

const COURSE_SLUGS = [
  "MEDICAL_VA",
  "REAL_ESTATE_VA",
  "US_BOOKKEEPING_VA",
] as const;

/* ------------------------------------------------------------------ */
/*  Job type enum values                                               */
/* ------------------------------------------------------------------ */

const JOB_TYPES = [
  "full-time",
  "part-time",
  "freelance",
  "contract",
] as const;

/* ------------------------------------------------------------------ */
/*  Create job posting schema                                          */
/* ------------------------------------------------------------------ */

export const createJobPostingSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less"),
  company: z
    .string()
    .min(1, "Company is required")
    .max(200, "Company must be 200 characters or less"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(5000, "Description must be 5000 characters or less"),
  requirements: z
    .array(z.string().min(1, "Requirement cannot be empty"))
    .min(1, "At least one requirement is needed"),
  skills: z
    .array(z.string().min(1, "Skill cannot be empty"))
    .min(1, "At least one skill is needed"),
  courseSlug: z.enum(COURSE_SLUGS).nullable().optional(),
  location: z
    .string()
    .min(1, "Location is required")
    .max(200, "Location must be 200 characters or less"),
  type: z.enum(JOB_TYPES, {
    message: "Type must be full-time, part-time, freelance, or contract",
  }),
  salaryRange: z
    .string()
    .max(100, "Salary range must be 100 characters or less")
    .nullable()
    .optional(),
});

/* ------------------------------------------------------------------ */
/*  Update job posting schema (partial)                                */
/* ------------------------------------------------------------------ */

export const updateJobPostingSchema = createJobPostingSchema.partial().extend({
  isActive: z.boolean().optional(),
});

/* ------------------------------------------------------------------ */
/*  AI match result schema (for validating AI response)                */
/* ------------------------------------------------------------------ */

export const aiMatchResultSchema = z.object({
  matchScore: z.number().int().min(0).max(100),
  reasoning: z.string().min(1),
});
