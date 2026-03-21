import { z } from "zod";

export const SUPPORTED_CURRENCIES = ["PHP", "USD", "EUR", "GBP"] as const;
export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

export const CURRENCY_SYMBOLS: Readonly<Record<CurrencyCode, string>> = {
  PHP: "₱",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

/* ------------------------------------------------------------------ */
/*  Discount config schema                                              */
/* ------------------------------------------------------------------ */

const discountConfigSchema = z
  .union([
    z.object({
      type: z.literal("percent"),
      value: z.number().min(0).max(100, "Percent discount must be 0–100"),
      active: z.boolean(),
    }),
    z.object({
      type: z.literal("fixed"),
      value: z.number().min(0, "Discount value must be 0 or greater"),
      active: z.boolean(),
    }),
  ])
  .nullable()
  .optional();

export type DiscountConfigInput = z.infer<typeof discountConfigSchema>;

/* ------------------------------------------------------------------ */
/*  Course schemas                                                      */
/* ------------------------------------------------------------------ */

export const createCourseSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(50, "Slug must be 50 characters or fewer")
    .regex(
      /^[A-Z0-9_]+$/,
      "Slug must contain only uppercase letters, numbers, and underscores",
    ),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or fewer"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters"),
  durationWeeks: z
    .number()
    .int("Duration must be a whole number")
    .min(1, "Duration must be at least 1 week")
    .max(52, "Duration must be 52 weeks or fewer"),
  price: z
    .number()
    .min(0, "Price must be 0 or greater"),
  currency: z
    .enum(SUPPORTED_CURRENCIES, {
      message: "Currency must be PHP, USD, EUR, or GBP",
    })
    .optional(),
  priceBasic: z.number().min(0, "Basic price must be 0 or greater").optional(),
  priceProfessional: z.number().min(0, "Professional price must be 0 or greater").optional(),
  priceAdvanced: z.number().min(0, "Advanced price must be 0 or greater").optional(),
  featuresBasic: z
    .array(z.string().min(1, "Feature cannot be empty"))
    .optional(),
  featuresProfessional: z
    .array(z.string().min(1, "Feature cannot be empty"))
    .optional(),
  featuresAdvanced: z
    .array(z.string().min(1, "Feature cannot be empty"))
    .optional(),
  popularTier: z.string().nullable().optional(),
  industry: z.string().max(100).optional(),
  outcomes: z
    .array(z.string().min(1, "Outcome cannot be empty"))
    .min(1, "At least one outcome is required"),
  isActive: z.boolean().optional(),
  discountBasic: discountConfigSchema,
  discountProfessional: discountConfigSchema,
  discountAdvanced: discountConfigSchema,
});

export const updateCourseSchema = createCourseSchema.partial();

export type CreateCourseData = z.infer<typeof createCourseSchema>;
export type UpdateCourseData = z.infer<typeof updateCourseSchema>;
