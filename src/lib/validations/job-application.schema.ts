import { z } from "zod";

export const applySchema = z.object({
  jobPostingId: z.string().min(1, "Job posting ID is required"),
  coverLetter: z
    .string()
    .min(50, "Cover letter must be at least 50 characters")
    .max(5000, "Cover letter must not exceed 5000 characters"),
});

export const updateApplicationStatusSchema = z.object({
  applicationId: z.string().min(1, "Application ID is required"),
  status: z.enum(["PENDING", "REVIEWED", "SHORTLISTED", "ACCEPTED", "REJECTED"]),
  adminNotes: z.string().max(2000, "Admin notes must not exceed 2000 characters").optional(),
});

export type ApplyInput = z.infer<typeof applySchema>;
export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>;
