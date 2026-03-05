import { z } from "zod";

export const generateDocumentSchema = z.object({
  type: z.enum(["proposal", "invoice", "contract", "email", "sop"]),
  clientName: z.string().max(200).optional().default(""),
  businessName: z.string().max(200).optional().default(""),
  details: z
    .string()
    .min(10, "Please provide at least a brief description")
    .max(3000, "Details are too long"),
});
