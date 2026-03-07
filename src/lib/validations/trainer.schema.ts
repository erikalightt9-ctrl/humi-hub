import { z } from "zod";

export const createTrainerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be 100 characters or fewer"),
  email: z.string().email("Must be a valid email address"),
  phone: z
    .string()
    .max(20, "Phone must be 20 characters or fewer")
    .optional(),
  bio: z
    .string()
    .max(2000, "Bio must be 2000 characters or fewer")
    .optional(),
  photoUrl: z
    .string()
    .max(500000, "Photo is too large")
    .optional()
    .nullable(),
  specializations: z
    .array(z.string().min(1, "Specialization cannot be empty"))
    .optional(),
});

export const updateTrainerSchema = createTrainerSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const assignTrainerSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  role: z.string().optional(),
});

export const unassignTrainerSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
});

export type CreateTrainerData = z.infer<typeof createTrainerSchema>;
export type UpdateTrainerData = z.infer<typeof updateTrainerSchema>;
export type AssignTrainerData = z.infer<typeof assignTrainerSchema>;
