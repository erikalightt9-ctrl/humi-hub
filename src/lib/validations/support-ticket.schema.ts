import { z } from "zod";

export const createTicketSchema = z.object({
  category: z.enum([
    "ENROLLMENT",
    "PAYMENT",
    "TECHNICAL_SUPPORT",
    "COURSE_CONTENT",
    "CERTIFICATION",
    "CORPORATE_TRAINING",
  ]),
  subject: z.string().min(3, "Subject must be at least 3 characters").max(200),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(5000),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
});

export const respondToTicketSchema = z.object({
  content: z
    .string()
    .min(1, "Response cannot be empty")
    .max(5000),
  isInternal: z.boolean().optional(),
});

export const updateTicketStatusSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assignedToId: z.string().optional().nullable(),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type RespondToTicketInput = z.infer<typeof respondToTicketSchema>;
export type UpdateTicketStatusInput = z.infer<typeof updateTicketStatusSchema>;
