import { prisma } from "@/lib/prisma";
import type {
  PlatformSettings,
  EmailSettings,
  SecuritySettings,
  BrandingSettings,
} from "@prisma/client";

/* ------------------------------------------------------------------ */
/*  Types (re-exported for convenience)                                */
/* ------------------------------------------------------------------ */

export type { PlatformSettings, EmailSettings, SecuritySettings, BrandingSettings };

export type AllSettings = {
  readonly platform: PlatformSettings;
  readonly email: EmailSettings;
  readonly security: SecuritySettings;
  readonly branding: BrandingSettings;
};

/* Subset safe to expose publicly (no SMTP credentials) */
export type PublicSettings = {
  readonly siteName: string;
  readonly timezone: string;
  readonly currency: string;
  readonly language: string;
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly logoUrl: string;
  readonly faviconUrl: string;
  readonly bannerImageUrl: string;
  readonly bannerTagline: string;
};

/* ------------------------------------------------------------------ */
/*  Default values                                                     */
/* ------------------------------------------------------------------ */

const PLATFORM_DEFAULTS = {
  siteName: "HUMI Hub",
  timezone: "Asia/Manila",
  currency: "PHP",
  language: "en",
} as const;

const EMAIL_DEFAULTS = {
  smtpHost: "smtp.gmail.com",
  smtpPort: 587,
  smtpUser: "",
  smtpPassword: "",
  fromName: "HUMI Hub",
  fromEmail: "",
  enrollmentEmails: true,
  lessonEmails: true,
  announcementEmails: true,
  certificationEmails: true,
} as const;

const SECURITY_DEFAULTS = {
  passwordMinLength: 8,
  requireUppercase: true,
  requireNumbers: true,
  requireSymbols: false,
  sessionTimeoutMins: 60,
  maxLoginAttempts: 5,
} as const;

const BRANDING_DEFAULTS = {
  logoUrl: "",
  faviconUrl: "",
  primaryColor: "#1d4ed8",
  secondaryColor: "#7c3aed",
  bannerImageUrl: "",
  bannerTagline: "Your Path to a VA Career",
} as const;

/* ------------------------------------------------------------------ */
/*  Platform Settings                                                  */
/* ------------------------------------------------------------------ */

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const row = await prisma.platformSettings.findUnique({ where: { id: "singleton" } });
  if (row) return row;
  return upsertPlatformSettings(PLATFORM_DEFAULTS);
}

export async function upsertPlatformSettings(
  data: Partial<Omit<PlatformSettings, "id" | "updatedAt">>,
): Promise<PlatformSettings> {
  return prisma.platformSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...PLATFORM_DEFAULTS, ...data },
    update: data,
  });
}

/* ------------------------------------------------------------------ */
/*  Email Settings                                                     */
/* ------------------------------------------------------------------ */

export async function getEmailSettings(): Promise<EmailSettings> {
  const row = await prisma.emailSettings.findUnique({ where: { id: "singleton" } });
  if (row) return row;
  return upsertEmailSettings(EMAIL_DEFAULTS);
}

export async function upsertEmailSettings(
  data: Partial<Omit<EmailSettings, "id" | "updatedAt">>,
): Promise<EmailSettings> {
  return prisma.emailSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...EMAIL_DEFAULTS, ...data },
    update: data,
  });
}

/* ------------------------------------------------------------------ */
/*  Security Settings                                                  */
/* ------------------------------------------------------------------ */

export async function getSecuritySettings(): Promise<SecuritySettings> {
  const row = await prisma.securitySettings.findUnique({ where: { id: "singleton" } });
  if (row) return row;
  return upsertSecuritySettings(SECURITY_DEFAULTS);
}

export async function upsertSecuritySettings(
  data: Partial<Omit<SecuritySettings, "id" | "updatedAt">>,
): Promise<SecuritySettings> {
  return prisma.securitySettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...SECURITY_DEFAULTS, ...data },
    update: data,
  });
}

/* ------------------------------------------------------------------ */
/*  Branding Settings                                                  */
/* ------------------------------------------------------------------ */

export async function getBrandingSettings(): Promise<BrandingSettings> {
  const row = await prisma.brandingSettings.findUnique({ where: { id: "singleton" } });
  if (row) return row;
  return upsertBrandingSettings(BRANDING_DEFAULTS);
}

export async function upsertBrandingSettings(
  data: Partial<Omit<BrandingSettings, "id" | "updatedAt">>,
): Promise<BrandingSettings> {
  return prisma.brandingSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...BRANDING_DEFAULTS, ...data },
    update: data,
  });
}

/* ------------------------------------------------------------------ */
/*  All Settings (parallel fetch)                                     */
/* ------------------------------------------------------------------ */

export async function getAllSettings(): Promise<AllSettings> {
  const [platform, email, security, branding] = await Promise.all([
    getPlatformSettings(),
    getEmailSettings(),
    getSecuritySettings(),
    getBrandingSettings(),
  ]);
  return { platform, email, security, branding };
}

export async function getPublicSettings(): Promise<PublicSettings> {
  const [platform, branding] = await Promise.all([
    getPlatformSettings(),
    getBrandingSettings(),
  ]);
  return {
    siteName: platform.siteName,
    timezone: platform.timezone,
    currency: platform.currency,
    language: platform.language,
    primaryColor: branding.primaryColor,
    secondaryColor: branding.secondaryColor,
    logoUrl: branding.logoUrl,
    faviconUrl: branding.faviconUrl,
    bannerImageUrl: branding.bannerImageUrl,
    bannerTagline: branding.bannerTagline,
  };
}
