import { z } from "zod";

export const generalSettingsSchema = z.object({
  siteName: z.string().min(1, "Site name is required").max(100),
  timezone: z.string().min(1, "Timezone is required"),
  currency: z.enum(["PHP", "USD", "EUR", "GBP", "AUD", "CAD", "SGD"]),
  language: z.enum(["en", "fil"]),
});

export const emailSettingsSchema = z.object({
  smtpHost: z.string().min(1, "SMTP host is required"),
  smtpPort: z.number().int().min(1).max(65535),
  smtpUser: z.string(),
  smtpPassword: z.string(),
  fromName: z.string().min(1, "From name is required"),
  fromEmail: z.string().email("Invalid email").or(z.literal("")),
  enrollmentEmails: z.boolean(),
  lessonEmails: z.boolean(),
  announcementEmails: z.boolean(),
  certificationEmails: z.boolean(),
});

export const securitySettingsSchema = z.object({
  passwordMinLength: z.number().int().min(6).max(32),
  requireUppercase: z.boolean(),
  requireNumbers: z.boolean(),
  requireSymbols: z.boolean(),
  sessionTimeoutMins: z.number().int().min(5).max(1440),
  maxLoginAttempts: z.number().int().min(1).max(20),
});

const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

export const brandingSettingsSchema = z.object({
  logoUrl: z.string().url("Must be a valid URL").or(z.literal("")),
  faviconUrl: z.string().url("Must be a valid URL").or(z.literal("")),
  primaryColor: z
    .string()
    .regex(hexColorRegex, "Must be a 6-digit hex color (e.g. #1d4ed8)"),
  secondaryColor: z
    .string()
    .regex(hexColorRegex, "Must be a 6-digit hex color (e.g. #7c3aed)"),
  bannerImageUrl: z.string().url("Must be a valid URL").or(z.literal("")),
  bannerTagline: z.string().max(200),
});

export type GeneralSettingsInput = z.infer<typeof generalSettingsSchema>;
export type EmailSettingsInput = z.infer<typeof emailSettingsSchema>;
export type SecuritySettingsInput = z.infer<typeof securitySettingsSchema>;
export type BrandingSettingsInput = z.infer<typeof brandingSettingsSchema>;
