import sanitizeHtml from "sanitize-html";
import { prisma } from "@/lib/prisma";
import {
  createEnrollment,
  countEnrollmentsByEmail,
} from "@/lib/repositories/enrollment.repository";
import {
  sendEnrollmentConfirmationWithPayment,
  sendNewEnrollmentAdminNotification,
} from "@/lib/services/notification.service";
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

const MAX_ENROLLMENTS_PER_EMAIL = 5;

export type EnrollmentResult =
  | { success: true; enrollment: Enrollment }
  | { success: false; code: "EMAIL_LIMIT_REACHED" | "RATE_LIMITED" | "VALIDATION_ERROR"; message: string };

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

  // Email usage limit check (max 5 enrollments per email)
  const emailCount = await countEnrollmentsByEmail(data.email);
  if (emailCount >= MAX_ENROLLMENTS_PER_EMAIL) {
    return {
      success: false,
      code: "EMAIL_LIMIT_REACHED",
      message: `This email has reached the maximum of ${MAX_ENROLLMENTS_PER_EMAIL} enrollment applications. Please use a different email.`,
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

  // Fetch course title for the confirmation email
  const course = await prisma.course.findUnique({
    where: { id: enrollment.courseId },
    select: { title: true },
  });
  const courseTitle = course?.title ?? "Selected Course";
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const submittedAt = enrollment.createdAt.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Send enrollment confirmation with payment instructions (non-blocking)
  sendEnrollmentConfirmationWithPayment({
    fullName: enrollment.fullName,
    email: enrollment.email,
    courseTitle,
    enrollmentId: enrollment.id,
    submittedAt,
    paymentUrl: `${base}/pay/${enrollment.id}`,
    statusTrackingUrl: `${base}/enrollment-status/${enrollment.id}`,
  }).catch((err) => {
    console.error("[Email] Failed to send enrollment confirmation:", err);
  });

  // Notify admin(s) about new enrollment (non-blocking)
  notifyAdminsOfNewEnrollment(enrollment).catch((err) => {
    console.error("[Email] Failed to notify admin:", err);
  });

  return { success: true, enrollment };
}

async function notifyAdminsOfNewEnrollment(enrollment: Enrollment): Promise<void> {
  // Fetch admin emails from the database
  const admins = await prisma.admin.findMany({ select: { email: true } });
  const adminEmails = admins.map((a) => a.email);

  // Fallback to env var if no admins in DB
  if (adminEmails.length === 0) {
    const fallback = process.env.ADMIN_EMAIL;
    if (fallback) adminEmails.push(fallback);
  }

  if (adminEmails.length === 0) return;

  // Fetch course title
  const course = await prisma.course.findUnique({
    where: { id: enrollment.courseId },
    select: { title: true },
  });

  const submittedAt = enrollment.createdAt.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  await sendNewEnrollmentAdminNotification({
    adminEmails,
    enrolleeName: enrollment.fullName,
    enrolleeEmail: enrollment.email,
    courseTitle: course?.title ?? "Selected Course",
    enrollmentId: enrollment.id,
    submittedAt,
  });
}
