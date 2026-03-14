import { z } from "zod";

/* ------------------------------------------------------------------ */
/*  Organization schemas                                               */
/* ------------------------------------------------------------------ */

export const createOrganizationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(200),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens"),
  email: z.string().email("Invalid email address").toLowerCase(),
  industry: z.string().max(100).nullable().optional(),
  maxSeats: z.number().int().min(1).max(1000).optional(),
});

export const updateOrganizationSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  industry: z.string().max(100).nullable().optional(),
  logoUrl: z.string().url().nullable().optional(),
  maxSeats: z.number().int().min(1).max(1000).optional(),
  isActive: z.boolean().optional(),
});

/* ------------------------------------------------------------------ */
/*  Corporate manager schemas                                          */
/* ------------------------------------------------------------------ */

export const createManagerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").toLowerCase(),
});

/* ------------------------------------------------------------------ */
/*  Employee enrollment schema                                         */
/* ------------------------------------------------------------------ */

export const enrollEmployeeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").toLowerCase(),
  courseId: z.string().cuid("Invalid course selection"),
  courseTier: z.enum(["BASIC", "PROFESSIONAL", "ADVANCED"]),
});

/* ------------------------------------------------------------------ */
/*  Settings update schema                                             */
/* ------------------------------------------------------------------ */

export const updateSettingsSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  industry: z.string().max(100).nullable().optional(),
});
