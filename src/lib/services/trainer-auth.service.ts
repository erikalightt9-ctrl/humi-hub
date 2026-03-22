import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const BCRYPT_ROUNDS = 12;
const TEMP_PASSWORD_LENGTH = 12;

/**
 * Generate a random temporary password for a trainer.
 */
export function generateTrainerPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  let password = "";
  const bytes = crypto.randomBytes(TEMP_PASSWORD_LENGTH);
  for (let i = 0; i < TEMP_PASSWORD_LENGTH; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}

/**
 * Grant login access to a trainer by generating credentials.
 * Returns the plain-text temporary password (for admin to share).
 * Sets mustChangePassword=true so the trainer is forced to change it on first login.
 */
export async function grantTrainerAccess(
  trainerId: string,
): Promise<{ readonly temporaryPassword: string }> {
  const temporaryPassword = generateTrainerPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, BCRYPT_ROUNDS);

  await prisma.trainer.update({
    where: { id: trainerId },
    data: {
      passwordHash,
      accessGranted: true,
      mustChangePassword: true,
      failedAttempts: 0,
    },
  });

  return { temporaryPassword };
}

/**
 * Revoke login access for a trainer.
 */
export async function revokeTrainerAccess(
  trainerId: string,
): Promise<void> {
  await prisma.trainer.update({
    where: { id: trainerId },
    data: {
      accessGranted: false,
    },
  });
}

/**
 * Reset a trainer's password and return the new temporary password.
 * Sets mustChangePassword=true and resets failedAttempts.
 */
export async function resetTrainerPassword(
  trainerId: string,
): Promise<{ readonly temporaryPassword: string }> {
  const temporaryPassword = generateTrainerPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, BCRYPT_ROUNDS);

  await prisma.trainer.update({
    where: { id: trainerId },
    data: { passwordHash, mustChangePassword: true, failedAttempts: 0 },
  });

  return { temporaryPassword };
}

/* ------------------------------------------------------------------ */
/*  Trainer self-service password change                               */
/* ------------------------------------------------------------------ */

export type ChangeTrainerPasswordResult =
  | { readonly success: true }
  | { readonly success: false; readonly error: string };

/**
 * Verify current password, hash and save the new one, clear the
 * mustChangePassword flag, and reset failedAttempts.
 */
export async function changeTrainerPassword(
  trainerId: string,
  currentPassword: string,
  newPassword: string,
): Promise<ChangeTrainerPasswordResult> {
  const trainer = await prisma.trainer.findUnique({
    where: { id: trainerId },
    select: { passwordHash: true },
  });

  if (!trainer?.passwordHash) {
    return { success: false, error: "Trainer account not found." };
  }

  const isMatch = await bcrypt.compare(currentPassword, trainer.passwordHash);
  if (!isMatch) {
    return { success: false, error: "Current password is incorrect." };
  }

  const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  await prisma.trainer.update({
    where: { id: trainerId },
    data: { passwordHash: newHash, mustChangePassword: false, failedAttempts: 0 },
  });

  return { success: true };
}
