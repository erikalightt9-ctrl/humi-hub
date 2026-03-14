import { z } from "zod";

export const createArticleSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  content: z.string().min(10, "Content must be at least 10 characters"),
  category: z.enum([
    "GETTING_STARTED",
    "COURSE_ENROLLMENT",
    "PAYMENT_GUIDE",
    "CERTIFICATION_GUIDE",
    "CORPORATE_TRAINING_GUIDE",
    "TECHNICAL_TROUBLESHOOTING",
  ]),
  isPublished: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

export const updateArticleSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  content: z.string().min(10).optional(),
  category: z
    .enum([
      "GETTING_STARTED",
      "COURSE_ENROLLMENT",
      "PAYMENT_GUIDE",
      "CERTIFICATION_GUIDE",
      "CORPORATE_TRAINING_GUIDE",
      "TECHNICAL_TROUBLESHOOTING",
    ])
    .optional(),
  isPublished: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
