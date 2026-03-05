import { z } from "zod";

export const createTestimonialSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be 100 characters or fewer"),
  role: z
    .string()
    .min(1, "Role is required")
    .max(100, "Role must be 100 characters or fewer"),
  company: z
    .string()
    .min(1, "Company is required")
    .max(200, "Company must be 200 characters or fewer"),
  content: z
    .string()
    .min(10, "Content must be at least 10 characters")
    .max(2000, "Content must be 2000 characters or fewer"),
  rating: z
    .number()
    .int("Rating must be a whole number")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
  avatarUrl: z.string().url("Must be a valid URL").nullable().optional(),
  isPublished: z.boolean().optional(),
  displayOrder: z
    .number()
    .int("Display order must be a whole number")
    .min(0, "Display order must be 0 or greater")
    .optional(),
});

export const updateTestimonialSchema = createTestimonialSchema.partial();

export type CreateTestimonialData = z.infer<typeof createTestimonialSchema>;
export type UpdateTestimonialData = z.infer<typeof updateTestimonialSchema>;
