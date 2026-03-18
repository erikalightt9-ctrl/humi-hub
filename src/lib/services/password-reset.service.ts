import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export type UserType = "student" | "admin" | "manager";

export type RequestPasswordResetResult =
  | { success: true; token: string }
  | { success: false; error: string };

export type ResetPasswordResult =
  | { success: true }
  | { success: false; error: string };

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function oneHourFromNow(): Date {
  return new Date(Date.now() + 60 * 60 * 1000);
}

/* ------------------------------------------------------------------ */
/*  Request Password Reset                                              */
/* ------------------------------------------------------------------ */

/**
 * Finds the user by email (scoped to tenant for students + managers),
 * generates a secure token, sets 1-hour expiry, and saves it.
 * Returns silently if email is not found (prevents enumeration).
 */
export async function requestPasswordReset(
  email: string,
  userType: UserType,
  tenantId?: string,
): Promise<RequestPasswordResetResult> {
  const normalizedEmail = email.toLowerCase().trim();
  const token = generateToken();
  const expiresAt = oneHourFromNow();

  if (userType === "student") {
    const student = await prisma.student.findFirst({
      where: {
        email: normalizedEmail,
        ...(tenantId ? { organizationId: tenantId } : {}),
      },
      select: { id: true },
    });

    if (!student) return { success: true, token: "" }; // silent

    await prisma.student.update({
      where: { id: student.id },
      data: { resetToken: token, resetTokenExpiresAt: expiresAt },
    });

    return { success: true, token };
  }

  if (userType === "manager") {
    const manager = await prisma.corporateManager.findFirst({
      where: {
        email: normalizedEmail,
        ...(tenantId ? { organizationId: tenantId } : {}),
      },
      select: { id: true },
    });

    if (!manager) return { success: true, token: "" }; // silent

    await prisma.corporateManager.update({
      where: { id: manager.id },
      data: { resetToken: token, resetTokenExpiresAt: expiresAt },
    });

    return { success: true, token };
  }

  if (userType === "admin") {
    const admin = await prisma.admin.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (!admin) return { success: true, token: "" }; // silent

    await prisma.admin.update({
      where: { id: admin.id },
      data: { resetToken: token, resetTokenExpiresAt: expiresAt },
    });

    return { success: true, token };
  }

  return { success: false, error: "Invalid user type." };
}

/* ------------------------------------------------------------------ */
/*  Reset Password                                                      */
/* ------------------------------------------------------------------ */

/**
 * Finds user by token, validates expiry, updates password, clears token.
 */
export async function resetPassword(
  token: string,
  newPassword: string,
  userType: UserType,
): Promise<ResetPasswordResult> {
  const passwordHash = await bcrypt.hash(newPassword, 12);
  const now = new Date();

  if (userType === "student") {
    const student = await prisma.student.findFirst({
      where: { resetToken: token },
      select: { id: true, resetTokenExpiresAt: true },
    });

    if (!student) return { success: false, error: "Invalid or expired token." };
    if (!student.resetTokenExpiresAt || student.resetTokenExpiresAt < now)
      return { success: false, error: "Token has expired." };

    await prisma.student.update({
      where: { id: student.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiresAt: null,
        mustChangePassword: false,
      },
    });

    return { success: true };
  }

  if (userType === "manager") {
    const manager = await prisma.corporateManager.findFirst({
      where: { resetToken: token },
      select: { id: true, resetTokenExpiresAt: true },
    });

    if (!manager) return { success: false, error: "Invalid or expired token." };
    if (!manager.resetTokenExpiresAt || manager.resetTokenExpiresAt < now)
      return { success: false, error: "Token has expired." };

    await prisma.corporateManager.update({
      where: { id: manager.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiresAt: null,
        mustChangePassword: false,
      },
    });

    return { success: true };
  }

  if (userType === "admin") {
    const admin = await prisma.admin.findFirst({
      where: { resetToken: token },
      select: { id: true, resetTokenExpiresAt: true },
    });

    if (!admin) return { success: false, error: "Invalid or expired token." };
    if (!admin.resetTokenExpiresAt || admin.resetTokenExpiresAt < now)
      return { success: false, error: "Token has expired." };

    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiresAt: null,
      },
    });

    return { success: true };
  }

  return { success: false, error: "Invalid user type." };
}
