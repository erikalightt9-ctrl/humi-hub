import sanitizeHtml from "sanitize-html";
import { prisma } from "@/lib/prisma";
import {
  createEnrollment,
  findEnrollmentByEmail,
} from "@/lib/repositories/enrollment.repository";
import { sendConfirmationEmail } from "@/lib/email/send-confirmation";
import type { EnrollmentFormData } from "@/lib/validations/enrollment.schema";
import type { Enrollment } from "@prisma/client";

const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_ENROLLMENT_MAX ?? "5", 10);
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_ENROLLMENT_WINDOW_MS ?? "900000", 10);

function sanitizeText(value: string): string {
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim();
}

export async function checkRateLimit(ip: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);

  const count = await prisma.rateLimitAttempt.count({
    where: {
      ip,
      endpoint: "enrollment",
      createdAt: { gte: windowStart },
    },
  });

  return count < RATE_LIMIT_MAX;
}

export async function recordRateLimitAttempt(ip: string): Promise<void> {
  await prisma.rateLimitAttempt.create({
    data: { ip, endpoint: "enrollment" },
  });
}

export type EnrollmentResult =
  | { success: true; enrollment: Enrollment }
  | { success: false; code: "DUPLICATE_EMAIL" | "RATE_LIMITED" | "VALIDATION_ERROR"; message: string };

export async function processEnrollment(
  data: EnrollmentFormData,
  ipAddress: string
): Promise<EnrollmentResult> {
  // Rate limit check
  const allowed = await checkRateLimit(ipAddress);
  if (!allowed) {
    return {
      success: false,
      code: "RATE_LIMITED",
      message: "Too many enrollment attempts. Please try again later.",
    };
  }

  // Record attempt
  await recordRateLimitAttempt(ipAddress);

  // Duplicate email check
  const existing = await findEnrollmentByEmail(data.email);
  if (existing) {
    return {
      success: false,
      code: "DUPLICATE_EMAIL",
      message: "An enrollment with this email address already exists.",
    };
  }

  // Sanitize all text fields
  const sanitized: EnrollmentFormData = {
    ...data,
    fullName: sanitizeText(data.fullName),
    address: sanitizeText(data.address),
    educationalBackground: sanitizeText(data.educationalBackground),
    workExperience: sanitizeText(data.workExperience),
    whyEnroll: sanitizeText(data.whyEnroll),
    contactNumber: sanitizeText(data.contactNumber),
    technicalSkills: data.technicalSkills.map(sanitizeText).filter(Boolean),
  };

  // Create enrollment
  const enrollment = await createEnrollment({ ...sanitized, ipAddress });

  // Send confirmation email (non-blocking — log error but don't fail)
  sendConfirmationEmail(enrollment).catch((err) => {
    console.error("[Email] Failed to send confirmation:", err);
  });

  return { success: true, enrollment };
}
