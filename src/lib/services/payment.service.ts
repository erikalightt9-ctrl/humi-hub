import { writeFile } from "fs/promises";
import { join } from "path";
import bcrypt from "bcryptjs";
import {
  createPayment,
  verifyPayment,
  findPaymentById,
} from "@/lib/repositories/payment.repository";
import { prisma } from "@/lib/prisma";
import { sendPaymentConfirmed } from "@/lib/services/notification.service";
import { generateTemporaryPassword, studentExists } from "@/lib/services/student-auth.service";
import type { Payment, EnrollmentStatus } from "@prisma/client";

const ALLOWED_PROOF_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
];
const MAX_PROOF_SIZE = 5 * 1024 * 1024; // 5MB

export interface ProofUploadResult {
  filePath: string;
  fileName: string;
}

export async function handleProofUpload(file: File): Promise<ProofUploadResult> {
  if (!ALLOWED_PROOF_TYPES.includes(file.type)) {
    throw new Error("Invalid file type. Only images (JPEG, PNG, GIF, WebP) and PDF are allowed.");
  }
  if (file.size > MAX_PROOF_SIZE) {
    throw new Error("File too large. Maximum size is 5MB.");
  }

  const ext = file.name.split(".").pop() ?? "bin";
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const relativePath = `/uploads/payments/${uniqueName}`;
  const absolutePath = join(process.cwd(), "public", "uploads", "payments", uniqueName);

  const bytes = await file.arrayBuffer();
  await writeFile(absolutePath, Buffer.from(bytes));

  return { filePath: relativePath, fileName: file.name };
}

export async function submitPaymentProof(opts: {
  enrollmentId: string;
  amount: number;
  method: string;
  referenceNumber?: string;
  notes?: string;
  proofFilePath: string;
  proofFileName: string;
  paidAt?: Date;
}): Promise<Payment> {
  return createPayment({
    enrollmentId: opts.enrollmentId,
    amount: opts.amount,
    method: opts.method,
    referenceNumber: opts.referenceNumber,
    notes: opts.notes,
    proofFilePath: opts.proofFilePath,
    proofFileName: opts.proofFileName,
    paidAt: opts.paidAt,
  });
}

export async function approvePayment(
  paymentId: string,
  adminId: string
): Promise<void> {
  // 1. Mark payment as PAID with admin verification
  await verifyPayment(paymentId, adminId, true);

  // 2. Fetch full payment details
  const fullPayment = await findPaymentById(paymentId);
  if (!fullPayment) return;

  const { enrollment } = fullPayment;
  const coursePrice = Number(enrollment.course.price);

  // 3. Check idempotency — skip student creation if already exists
  const alreadyExists = await studentExists(enrollment.id);
  if (alreadyExists) {
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        status: "ENROLLED" as EnrollmentStatus,
        paymentStatus: "PAID",
        statusUpdatedAt: new Date(),
        statusUpdatedBy: adminId,
      },
    });
    return;
  }

  // 4. Generate credentials for the new student
  const tempPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 12);
  const accessExpiry = new Date();
  accessExpiry.setDate(accessExpiry.getDate() + 90);

  // 5. Atomic transaction: update enrollment + create student
  await prisma.$transaction([
    prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        status: "ENROLLED" as EnrollmentStatus,
        paymentStatus: "PAID",
        statusUpdatedAt: new Date(),
        statusUpdatedBy: adminId,
      },
    }),
    prisma.student.create({
      data: {
        enrollmentId: enrollment.id,
        email: enrollment.email.toLowerCase(),
        name: enrollment.fullName,
        passwordHash,
        paymentStatus: "PAID",
        amountPaid: coursePrice,
        accessGranted: true,
        accessExpiry,
      },
    }),
  ]);

  // 6. Send payment confirmed email with credentials (fire-and-forget)
  sendPaymentConfirmed({
    name: enrollment.fullName,
    email: enrollment.email,
    courseTitle: enrollment.course.title,
    amount: `PHP ${coursePrice.toLocaleString()}`,
    paymentMethod: fullPayment.method,
    temporaryPassword: tempPassword,
  });
}

export async function rejectPayment(
  paymentId: string,
  adminId: string
): Promise<void> {
  await verifyPayment(paymentId, adminId, false);
}
