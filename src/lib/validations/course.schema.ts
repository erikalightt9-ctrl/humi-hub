import { z } from "zod";

export const SUPPORTED_CURRENCIES = ["PHP", "USD", "EUR", "GBP"] as const;
export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

export const CURRENCY_SYMBOLS: Readonly<Record<CurrencyCode, string>> = {
  PHP: "₱",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

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
  outcomes: z
    .array(z.string().min(1, "Outcome cannot be empty"))
    .min(1, "At least one outcome is required"),
  isActive: z.boolean().optional(),
});

export const updateCourseSchema = createCourseSchema.partial();

export type CreateCourseData = z.infer<typeof createCourseSchema>;
export type UpdateCourseData = z.infer<typeof updateCourseSchema>;
