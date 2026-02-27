import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function createStudentAccount(
  enrollmentId: string,
  email: string,
  name: string,
  password: string
): Promise<void> {
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.student.create({
    data: {
      enrollmentId,
      email: email.toLowerCase(),
      name,
      passwordHash,
    },
  });
}

export async function studentExists(enrollmentId: string): Promise<boolean> {
  const student = await prisma.student.findUnique({ where: { enrollmentId } });
  return student !== null;
}

export function generateTemporaryPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
