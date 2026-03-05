import { z } from "zod";

const PAYMENT_METHODS = ["GCASH", "BANK_TRANSFER"] as const;

export const paymentProofSchema = z.object({
  enrollmentId: z.string().min(1, "Enrollment ID is required"),
  method: z.enum(PAYMENT_METHODS, {
    error: "Payment method must be GCASH or BANK_TRANSFER",
  }),
  referenceNumber: z.string().min(1, "Reference number is required"),
  paidAt: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export const verifyPaymentSchema = z.object({
  approved: z.boolean(),
});

export const createCheckoutSchema = z.object({
  enrollmentId: z.string().min(1, "Enrollment ID is required"),
});

export type PaymentProofInput = z.infer<typeof paymentProofSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;
