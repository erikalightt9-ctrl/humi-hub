import { z } from "zod";

export const certNumberSchema = z
  .string()
  .min(1, "Certificate number is required")
  .max(50, "Certificate number is too long")
  .trim();
