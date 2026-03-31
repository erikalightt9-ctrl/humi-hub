import { z } from "zod";

export const tenantRegisterSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),
  email: z.string().email("Enter a valid email address"),
  phone: z
    .string()
    .min(7, "Enter a valid phone number")
    .max(20, "Phone number is too long")
    .regex(/^[+\d\s\-().]+$/, "Invalid phone format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long"),
  confirmPassword: z.string(),
  courseId: z.string().cuid("Please select a course"),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type TenantRegisterData = z.infer<typeof tenantRegisterSchema>;
