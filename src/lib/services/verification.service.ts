import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { EnrollmentStatus } from "@prisma/client";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EMAIL_TOKEN_EXPIRY_HOURS = 24;
const ACTIVATION_TOKEN_EXPIRY_HOURS = 48;
const BCRYPT_ROUNDS = 12;
const ACCESS_DURATION_DAYS = 90;

// ---------------------------------------------------------------------------
// Result types (immutable readonly interfaces)
// ---------------------------------------------------------------------------

interface VerifyEmailSuccess {
  readonly success: true;
  readonly enrollmentId: string;
}

interface VerifyEmailFailure {
  readonly success: false;
  readonly error: "invalid" | "expired" | "already_verified";
}

export type VerifyEmailResult = VerifyEmailSuccess | VerifyEmailFailure;

interface ValidateActivationSuccess {
  readonly success: true;
  readonly enrollment: {
    readonly id: string;
    readonly fullName: string;
    readonly email: string;
    readonly courseTitle: string;
  };
}

interface ValidateActivationFailure {
  readonly success: false;
  readonly error: "invalid" | "expired";
}

export type ValidateActivationResult =
  | ValidateActivationSuccess
  | ValidateActivationFailure;

interface ActivateAccountSuccess {
  readonly success: true;
}

interface ActivateAccountFailure {
  readonly success: false;
  readonly error: "invalid" | "expired" | "already_activated";
}

export type ActivateAccountResult =
  | ActivateAccountSuccess
  | ActivateAccountFailure;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hoursFromNow(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

// ---------------------------------------------------------------------------
// Email verification
// ---------------------------------------------------------------------------

/**
 * Generates a unique email verification token for the given enrollment.
 * The token expires after 24 hours.
 */
export async function generateEmailVerificationToken(
  enrollmentId: string,
): Promise<string> {
  const token = randomUUID();

  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: {
      emailVerificationToken: token,
      emailTokenExpiresAt: hoursFromNow(EMAIL_TOKEN_EXPIRY_HOURS),
    },
  });

  return token;
}

/**
 * Validates an email verification token, marks the enrollment as EMAIL_VERIFIED,
 * and records the confirmation timestamp.
 */
export async function verifyEmailToken(
  token: string,
): Promise<VerifyEmailResult> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { emailVerificationToken: token },
    select: {
      id: true,
      emailTokenExpiresAt: true,
      emailConfirmedAt: true,
    },
  });

  if (!enrollment) {
    return { success: false, error: "invalid" };
  }

  if (enrollment.emailConfirmedAt) {
    return { success: false, error: "already_verified" };
  }

  if (
    !enrollment.emailTokenExpiresAt ||
    enrollment.emailTokenExpiresAt < new Date()
  ) {
    return { success: false, error: "expired" };
  }

  await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: {
      emailConfirmedAt: new Date(),
      status: "EMAIL_VERIFIED" as EnrollmentStatus,
      emailVerificationToken: null,
      emailTokenExpiresAt: null,
    },
  });

  return { success: true, enrollmentId: enrollment.id };
}

// ---------------------------------------------------------------------------
// Account activation
// ---------------------------------------------------------------------------

/**
 * Generates a unique activation token for the given enrollment.
 * The token expires after 48 hours.
 */
export async function generateActivationToken(
  enrollmentId: string,
): Promise<string> {
  const token = randomUUID();

  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: {
      activationToken: token,
      activationTokenExpiresAt: hoursFromNow(ACTIVATION_TOKEN_EXPIRY_HOURS),
    },
  });

  return token;
}

/**
 * Validates an activation token without consuming it.
 * Returns the enrollment details if the token is valid.
 */
export async function validateActivationToken(
  token: string,
): Promise<ValidateActivationResult> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { activationToken: token },
    select: {
      id: true,
      fullName: true,
      email: true,
      activationTokenExpiresAt: true,
      course: { select: { title: true } },
    },
  });

  if (!enrollment) {
    return { success: false, error: "invalid" };
  }

  if (
    !enrollment.activationTokenExpiresAt ||
    enrollment.activationTokenExpiresAt < new Date()
  ) {
    return { success: false, error: "expired" };
  }

  return {
    success: true,
    enrollment: {
      id: enrollment.id,
      fullName: enrollment.fullName,
      email: enrollment.email,
      courseTitle: enrollment.course.title,
    },
  };
}

/**
 * Creates a student account from an activation token.
 * Hashes the password, creates the Student record, and updates the Enrollment
 * status to ENROLLED inside a single transaction.
 */
export async function activateStudentAccount(
  token: string,
  password: string,
): Promise<ActivateAccountResult> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { activationToken: token },
    select: {
      id: true,
      fullName: true,
      email: true,
      activationTokenExpiresAt: true,
      student: { select: { id: true } },
      course: { select: { price: true } },
    },
  });

  if (!enrollment) {
    return { success: false, error: "invalid" };
  }

  if (
    !enrollment.activationTokenExpiresAt ||
    enrollment.activationTokenExpiresAt < new Date()
  ) {
    return { success: false, error: "expired" };
  }

  // Idempotency: student already exists for this enrollment
  if (enrollment.student) {
    return { success: false, error: "already_activated" };
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  await prisma.$transaction([
    prisma.student.create({
      data: {
        enrollmentId: enrollment.id,
        email: enrollment.email.toLowerCase(),
        name: enrollment.fullName,
        passwordHash,
        mustChangePassword: false,
        paymentStatus: "PAID",
        amountPaid: enrollment.course.price,
        accessGranted: true,
        accessExpiry: daysFromNow(ACCESS_DURATION_DAYS),
        portfolioPublic: false,
      },
    }),
    prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        status: "ENROLLED" as EnrollmentStatus,
        activationToken: null,
        activationTokenExpiresAt: null,
      },
    }),
  ]);

  return { success: true };
}
