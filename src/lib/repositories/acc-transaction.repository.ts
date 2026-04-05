import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export interface TransactionLineInput {
  accountId: string;
  description?: string;
  debitAmount: number;
  creditAmount: number;
}

export interface CreateTransactionInput {
  date: Date;
  description: string;
  reference?: string;
  sourceType?: string;
  sourceId?: string;
  createdById?: string;
  lines: TransactionLineInput[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

async function getNextTransactionNumber(
  tx: Prisma.TransactionClient,
  organizationId: string
): Promise<string> {
  const count = await tx.accTransaction.count({ where: { organizationId } });
  return `TXN-${String(count + 1).padStart(6, "0")}`;
}

function validateBalance(lines: TransactionLineInput[]) {
  const totalDebit  = lines.reduce((s, l) => s + l.debitAmount,  0);
  const totalCredit = lines.reduce((s, l) => s + l.creditAmount, 0);
  const diff = Math.abs(totalDebit - totalCredit);
  if (diff > 0.005) {
    throw new Error(
      `Debits (${totalDebit.toFixed(2)}) must equal credits (${totalCredit.toFixed(2)})`
    );
  }
}

/* ------------------------------------------------------------------ */
/*  Queries                                                             */
/* ------------------------------------------------------------------ */

export async function listTransactions(
  organizationId: string,
  filters: {
    status?: "DRAFT" | "POSTED" | "VOIDED";
    dateFrom?: Date;
    dateTo?: Date;
    search?: string;
    page?: number;
    limit?: number;
  }
) {
  const page  = filters.page  ?? 1;
  const limit = filters.limit ?? 20;
  const where: Prisma.AccTransactionWhereInput = {
    organizationId,
    ...(filters.status && { status: filters.status }),
    ...(filters.dateFrom && { date: { gte: filters.dateFrom } }),
    ...(filters.dateTo   && { date: { lte: filters.dateTo   } }),
    ...(filters.search   && {
      OR: [
        { description:       { contains: filters.search, mode: "insensitive" } },
        { transactionNumber: { contains: filters.search, mode: "insensitive" } },
        { reference:         { contains: filters.search, mode: "insensitive" } },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    prisma.accTransaction.findMany({
      where,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      include: {
        lines: { include: { account: { select: { code: true, name: true } } } },
      },
    }),
    prisma.accTransaction.count({ where }),
  ]);
  return { data, total, page, limit };
}

export async function getTransactionById(organizationId: string, id: string) {
  return prisma.accTransaction.findFirst({
    where: { id, organizationId },
    include: {
      lines: { include: { account: { select: { id: true, code: true, name: true, type: true } } } },
    },
  });
}

/* ------------------------------------------------------------------ */
/*  Mutations                                                           */
/* ------------------------------------------------------------------ */

export async function createTransaction(
  organizationId: string,
  data: CreateTransactionInput
) {
  validateBalance(data.lines);

  return prisma.$transaction(async (tx) => {
    const transactionNumber = await getNextTransactionNumber(tx, organizationId);
    return tx.accTransaction.create({
      data: {
        organizationId,
        transactionNumber,
        date:        data.date,
        description: data.description,
        reference:   data.reference   ?? null,
        sourceType:  data.sourceType  ?? null,
        sourceId:    data.sourceId    ?? null,
        createdById: data.createdById ?? null,
        status: "DRAFT",
        lines: {
          create: data.lines.map((l) => ({
            accountId:    l.accountId,
            description:  l.description ?? null,
            debitAmount:  new Prisma.Decimal(l.debitAmount),
            creditAmount: new Prisma.Decimal(l.creditAmount),
          })),
        },
      },
      include: { lines: true },
    });
  });
}

export async function postTransaction(
  organizationId: string,
  id: string,
  userId?: string
) {
  const txn = await prisma.accTransaction.findFirst({
    where: { id, organizationId },
    include: { lines: true },
  });
  if (!txn) throw new Error("Transaction not found");
  if (txn.status !== "DRAFT") throw new Error("Only DRAFT transactions can be posted");
  validateBalance(txn.lines.map((l) => ({
    accountId: l.accountId,
    debitAmount:  Number(l.debitAmount),
    creditAmount: Number(l.creditAmount),
  })));

  return prisma.accTransaction.update({
    where: { id },
    data: { status: "POSTED", postedAt: new Date(), createdById: userId ?? null },
  });
}

export async function voidTransaction(
  organizationId: string,
  id: string,
  reason: string,
  userId?: string
) {
  const txn = await prisma.accTransaction.findFirst({
    where: { id, organizationId },
    include: { lines: true },
  });
  if (!txn) throw new Error("Transaction not found");
  if (txn.status === "VOIDED") throw new Error("Transaction is already voided");

  return prisma.$transaction(async (tx) => {
    // Mark original as voided
    await tx.accTransaction.update({
      where: { id },
      data: { status: "VOIDED", voidedAt: new Date(), voidReason: reason },
    });

    if (txn.status === "POSTED") {
      // Create reversing entry
      const reversalNumber = await getNextTransactionNumber(tx, organizationId);
      await tx.accTransaction.create({
        data: {
          organizationId,
          transactionNumber: reversalNumber,
          date:        new Date(),
          description: `REVERSAL: ${txn.description}`,
          reference:   txn.reference ?? null,
          sourceType:  "REVERSAL",
          sourceId:    id,
          createdById: userId ?? null,
          status: "POSTED",
          postedAt: new Date(),
          lines: {
            create: txn.lines.map((l) => ({
              accountId:    l.accountId,
              description:  `Reversal of ${l.description ?? txn.description}`,
              debitAmount:  l.creditAmount,  // swap
              creditAmount: l.debitAmount,
            })),
          },
        },
      });
    }
  });
}
