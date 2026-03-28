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
  // Org details
  name: z.string().min(2).max(200).optional(),
  industry: z.string().max(100).nullable().optional(),
  // Branding
  logoUrl: z.string().url("Invalid logo URL").nullable().optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color")
    .nullable()
    .optional(),
  secondaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color")
    .nullable()
    .optional(),
  tagline: z.string().max(200).nullable().optional(),
  bannerImageUrl: z.string().url("Invalid banner URL").nullable().optional(),
  mission: z.string().max(1000).nullable().optional(),
  vision: z.string().max(1000).nullable().optional(),
});
