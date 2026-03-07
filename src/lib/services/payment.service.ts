import { writeFile } from "fs/promises";
import { join } from "path";
import {
  createPayment,
  verifyPayment,
  findPaymentById,
} from "@/lib/repositories/payment.repository";
import { prisma } from "@/lib/prisma";
import { sendPaymentConfirmed, sendEmailVerification } from "@/lib/services/notification.service";
import { studentExists } from "@/lib/services/student-auth.service";
import { generateEmailVerificationToken } from "@/lib/services/verification.service";
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

  // 3. Check idempotency — if student already exists, just update status
  const alreadyExists = await studentExists(enrollment.id);
  if (alreadyExists) {
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        status: "PAYMENT_VERIFIED" as EnrollmentStatus,
        paymentStatus: "PAID",
        statusUpdatedAt: new Date(),
        statusUpdatedBy: adminId,
      },
    });
    return;
  }

  // 4. Update enrollment to PAYMENT_VERIFIED + paymentStatus PAID
  await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: {
      status: "PAYMENT_VERIFIED" as EnrollmentStatus,
      paymentStatus: "PAID",
      statusUpdatedAt: new Date(),
      statusUpdatedBy: adminId,
    },
  });

  // 5. Generate email verification token and send verification email
  const token = await generateEmailVerificationToken(enrollment.id);
  const verificationUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/verify-email/${token}`;

  sendEmailVerification({
    name: enrollment.fullName,
    email: enrollment.email,
    courseTitle: enrollment.course.title,
    verificationUrl,
  }).catch((err) => {
    console.error("[Email] Failed to send email verification:", err);
  });
}

export async function rejectPayment(
  paymentId: string,
  adminId: string
): Promise<void> {
  await verifyPayment(paymentId, adminId, false);
}
