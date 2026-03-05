import { prisma } from "@/lib/prisma";
import type { Decimal } from "@prisma/client/runtime/client";
import type { Payment, PaymentStatus } from "@prisma/client";

export type PaymentWithEnrollment = Payment & {
  enrollment: {
    id: string;
    fullName: string;
    email: string;
    referenceCode: string | null;
    course: { id: string; title: string; price: Decimal };
  };
};

export async function createPayment(data: {
  enrollmentId: string;
  amount: number;
  method: string;
  proofFilePath?: string;
  proofFileName?: string;
  referenceNumber?: string;
  notes?: string;
  paidAt?: Date;
}): Promise<Payment> {
  return prisma.payment.create({
    data: {
      enrollmentId: data.enrollmentId,
      amount: data.amount,
      method: data.method,
      proofFilePath: data.proofFilePath,
      proofFileName: data.proofFileName,
      referenceNumber: data.referenceNumber,
      notes: data.notes,
      paidAt: data.paidAt,
    },
  });
}

export async function findPaymentById(id: string): Promise<PaymentWithEnrollment | null> {
  return prisma.payment.findUnique({
    where: { id },
    include: {
      enrollment: {
        select: {
          id: true,
          fullName: true,
          email: true,
          referenceCode: true,
          course: { select: { id: true, title: true, price: true } },
        },
      },
    },
  });
}

export async function findPaymentByReferenceNumber(
  referenceNumber: string
): Promise<PaymentWithEnrollment | null> {
  return prisma.payment.findFirst({
    where: { referenceNumber },
    include: {
      enrollment: {
        select: {
          id: true,
          fullName: true,
          email: true,
          referenceCode: true,
          course: { select: { id: true, title: true, price: true } },
        },
      },
    },
  });
}

export async function findPaymentsByEnrollment(enrollmentId: string): Promise<Payment[]> {
  return prisma.payment.findMany({
    where: { enrollmentId },
    orderBy: { createdAt: "desc" },
  });
}

export async function listPendingPayments(): Promise<PaymentWithEnrollment[]> {
  return prisma.payment.findMany({
    where: { status: "PENDING_PAYMENT" },
    include: {
      enrollment: {
        select: {
          id: true,
          fullName: true,
          email: true,
          referenceCode: true,
          course: { select: { id: true, title: true, price: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listAllPayments(filters?: {
  status?: PaymentStatus;
  page?: number;
  limit?: number;
}): Promise<{ data: PaymentWithEnrollment[]; total: number }> {
  const { status, page = 1, limit = 20 } = filters ?? {};
  const skip = (page - 1) * limit;

  const where = status ? { status } : {};

  const [data, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        enrollment: {
          select: {
            id: true,
            fullName: true,
            email: true,
            referenceCode: true,
            course: { select: { id: true, title: true, price: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.payment.count({ where }),
  ]);

  return { data, total };
}

export async function verifyPayment(
  paymentId: string,
  adminId: string,
  approved: boolean
): Promise<Payment> {
  const newStatus: PaymentStatus = approved ? "PAID" : "FAILED";

  return prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: newStatus,
      verifiedBy: adminId,
      verifiedAt: new Date(),
      paidAt: approved ? new Date() : undefined,
    },
  });
}

export async function updateEnrollmentPaymentStatus(
  enrollmentId: string,
  status: PaymentStatus
): Promise<void> {
  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { paymentStatus: status },
  });
}
