import crypto from "crypto";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export type UserType = "student" | "admin" | "manager";

export type RequestPasswordResetResult =
  | { success: true; token: string }
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
