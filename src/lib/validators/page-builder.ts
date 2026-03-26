import { z } from "zod";
import { GOOGLE_FONTS, MAX_PAGES_PER_ORG, MAX_SECTIONS_PER_PAGE } from "@/lib/constants/page-builder";

/* ------------------------------------------------------------------ */
/*  Section content schemas — one per SectionType                     */
/* ------------------------------------------------------------------ */

const heroContentSchema = z.object({
  headline: z.string().min(1, "Headline is required").max(200),
  subheadline: z.string().max(400).optional().default(""),
  backgroundImage: z.string().max(500).optional().default(""),
  ctaText: z.string().max(100).optional().default("Get Started"),
  ctaLink: z.string().max(500).optional().default("/enroll"),
});

const featureItemSchema = z.object({
  icon: z.string().max(10).optional().default("✓"),
  title: z.string().min(1).max(100),
  description: z.string().max(300).optional().default(""),
});

const featuresContentSchema = z.object({
  title: z.string().min(1).max(200),
  items: z.array(featureItemSchema).min(1).max(12),
});

const testimonialItemSchema = z.object({
  name: z.string().min(1).max(100),
  role: z.string().max(100).optional().default(""),
  quote: z.string().min(1).max(500),
  avatar: z.string().max(500).optional().default(""),
});

const testimonialsContentSchema = z.object({
  title: z.string().min(1).max(200),
  items: z.array(testimonialItemSchema).min(1).max(20),
});

const contactContentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional().default(""),
  showForm: z.boolean().optional().default(true),
});

const ctaContentSchema = z.object({
  headline: z.string().min(1).max(200),
  subheadline: z.string().max(400).optional().default(""),
  buttonText: z.string().min(1).max(100),
  buttonLink: z.string().min(1).max(500),
});

const textContentSchema = z.object({
  title: z.string().max(200).optional().default(""),
  body: z.string().min(1).max(10000),
});

const imageContentSchema = z.object({
  url: z.string().min(1, "Image URL is required").max(500),
  alt: z.string().max(300).optional().default(""),
  caption: z.string().max(300).optional().default(""),
});

/* ------------------------------------------------------------------ */
/*  Section schema — discriminated union on type                      */
/* ------------------------------------------------------------------ */

export const sectionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("HERO"), content: heroContentSchema }),
  z.object({ type: z.literal("FEATURES"), content: featuresContentSchema }),
  z.object({ type: z.literal("TESTIMONIALS"), content: testimonialsContentSchema }),
  z.object({ type: z.literal("CONTACT"), content: contactContentSchema }),
  z.object({ type: z.literal("CTA"), content: ctaContentSchema }),
  z.object({ type: z.literal("TEXT"), content: textContentSchema }),
  z.object({ type: z.literal("IMAGE"), content: imageContentSchema }),
]);

export type Section = z.infer<typeof sectionSchema>;

/* ------------------------------------------------------------------ */
/*  Page schemas                                                       */
/* ------------------------------------------------------------------ */

export const createPageSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens"),
  type: z.enum(["LANDING", "CONTACT", "CUSTOM"]).optional().default("CUSTOM"),
  isPublished: z.boolean().optional().default(false),
  sections: z.array(sectionSchema).max(MAX_SECTIONS_PER_PAGE).optional().default([]),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(400).optional(),
  order: z.number().int().min(0).optional().default(0),
});

export const updatePageSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens")
    .optional(),
  type: z.enum(["LANDING", "CONTACT", "CUSTOM"]).optional(),
  isPublished: z.boolean().optional(),
  sections: z.array(sectionSchema).max(MAX_SECTIONS_PER_PAGE).optional(),
  metaTitle: z.string().max(200).nullable().optional(),
  metaDescription: z.string().max(400).nullable().optional(),
  order: z.number().int().min(0).optional(),
});

/* ------------------------------------------------------------------ */
/*  Reorder sections schema                                            */
/* ------------------------------------------------------------------ */

export const reorderSectionsSchema = z.object({
  sections: z.array(sectionSchema).max(MAX_SECTIONS_PER_PAGE),
});

/* ------------------------------------------------------------------ */
/*  Theme schema                                                       */
/* ------------------------------------------------------------------ */

const hexColorSchema = z
  .string()
  .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "Must be a valid hex color (e.g. #FFF or #FFFFFF)");

const googleFontSchema = z.enum(GOOGLE_FONTS as unknown as [string, ...string[]]);

export const updateThemeSchema = z.object({
  primaryColor: hexColorSchema.optional(),
  secondaryColor: hexColorSchema.optional(),
  accentColor: hexColorSchema.optional(),
  backgroundColor: hexColorSchema.optional(),
  textColor: hexColorSchema.optional(),
  fontHeading: googleFontSchema.optional(),
  fontBody: googleFontSchema.optional(),
  logoUrl: z.string().max(500).nullable().optional(),
  faviconUrl: z.string().max(500).nullable().optional(),
  customCss: z.string().max(50000).nullable().optional(),
});

export type CreatePageInput = z.infer<typeof createPageSchema>;
export type UpdatePageInput = z.infer<typeof updatePageSchema>;
export type UpdateThemeInput = z.infer<typeof updateThemeSchema>;
export type ReorderSectionsInput = z.infer<typeof reorderSectionsSchema>;
