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
  credentials: z
    .string()
    .max(5000, "Credentials must be 5000 characters or fewer")
    .optional()
    .nullable(),
  certifications: z
    .array(z.string().min(1, "Certification cannot be empty"))
    .optional(),
  industryExperience: z
    .string()
    .max(5000, "Industry experience must be 5000 characters or fewer")
    .optional()
    .nullable(),
  yearsOfExperience: z
    .number()
    .int()
    .min(0, "Years of experience cannot be negative")
    .max(50, "Years of experience must be 50 or fewer")
    .optional(),
});

export const updateTrainerSchema = createTrainerSchema.partial().extend({
  isActive: z.boolean().optional(),
  accessGranted: z.boolean().optional(),
});

export const assignTrainerSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  role: z.string().optional(),
});

export const unassignTrainerSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
});

export const grantAccessSchema = z.object({
  action: z.enum(["grant", "revoke", "reset-password"]),
});

export type CreateTrainerData = z.infer<typeof createTrainerSchema>;
export type UpdateTrainerData = z.infer<typeof updateTrainerSchema>;
export type AssignTrainerData = z.infer<typeof assignTrainerSchema>;
