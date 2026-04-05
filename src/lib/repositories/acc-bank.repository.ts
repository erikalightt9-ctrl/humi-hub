import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export interface CreateBankAccountInput {
  name: string;
  bankName: string;
  accountNumber: string;
  currency?: string;
  accountId?: string;
  currentBalance?: number;
}

export interface BankTransactionInput {
  date: Date;
  description: string;
  amount: number;
  referenceNumber?: string;
}

/* ------------------------------------------------------------------ */
/*  Queries                                                             */
/* ------------------------------------------------------------------ */

export async function listBankAccounts(organizationId: string) {
  const accounts = await prisma.accBankAccount.findMany({
    where: { organizationId },
    include: { account: { select: { code: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  const withStats = await Promise.all(
    accounts.map(async (ba) => {
      const [matched, unmatched] = await Promise.all([
        prisma.accBankTransaction.count({ where: { bankAccountId: ba.id, status: "MATCHED" } }),
        prisma.accBankTransaction.count({ where: { bankAccountId: ba.id, status: { in: ["PENDING", "UNMATCHED"] } } }),
      ]);
      return { ...ba, matched, unmatched };
    })
  );
  return withStats;
}

export async function getBankAccountById(organizationId: string, id: string) {
  return prisma.accBankAccount.findFirst({
    where: { id, organizationId },
    include: { account: true },
  });
}

export async function listBankTransactions(
  bankAccountId: string,
  filters: {
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
  }
) {
  const page  = filters.page  ?? 1;
  const limit = filters.limit ?? 30;
  const where: Prisma.AccBankTransactionWhereInput = {
    bankAccountId,
    ...(filters.status   && { status: filters.status as never }),
    ...(filters.dateFrom && { date: { gte: filters.dateFrom } }),
    ...(filters.dateTo   && { date: { lte: filters.dateTo   } }),
  };

  const [data, total] = await Promise.all([
    prisma.accBankTransaction.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.accBankTransaction.count({ where }),
  ]);
  return { data, total, page, limit };
}

export async function getReconciliationSummary(bankAccountId: string) {
  const [matched, unmatched, pending, agg] = await Promise.all([
    prisma.accBankTransaction.aggregate({
      where: { bankAccountId, status: "MATCHED" },
      _count: true, _sum: { amount: true },
    }),
    prisma.accBankTransaction.aggregate({
      where: { bankAccountId, status: "UNMATCHED" },
      _count: true, _sum: { amount: true },
    }),
    prisma.accBankTransaction.aggregate({
      where: { bankAccountId, status: "PENDING" },
      _count: true, _sum: { amount: true },
    }),
    prisma.accBankTransaction.aggregate({
      where: { bankAccountId },
      _sum: { amount: true },
    }),
  ]);
  return { matched, unmatched, pending, total: agg._sum.amount };
}

/* ------------------------------------------------------------------ */
/*  Mutations                                                           */
/* ------------------------------------------------------------------ */

export async function createBankAccount(
  organizationId: string,
  data: CreateBankAccountInput
) {
  return prisma.accBankAccount.create({
    data: {
      organizationId,
      name:           data.name,
      bankName:       data.bankName,
      accountNumber:  data.accountNumber,
      currency:       data.currency       ?? "PHP",
      accountId:      data.accountId      ?? null,
      currentBalance: new Prisma.Decimal(data.currentBalance ?? 0),
    },
  });
}

export async function importBankTransactions(
  bankAccountId: string,
  transactions: BankTransactionInput[]
) {
  return prisma.accBankTransaction.createMany({
    data: transactions.map((t) => ({
      bankAccountId,
      date:            t.date,
      description:     t.description,
      amount:          new Prisma.Decimal(t.amount),
      referenceNumber: t.referenceNumber ?? null,
      status:          "PENDING" as const,
    })),
    skipDuplicates: true,
  });
}

export async function matchBankTransaction(
  bankTransactionId: string,
  transactionLineId: string
) {
  return prisma.accBankTransaction.update({
    where: { id: bankTransactionId },
    data: {
      status:                   "MATCHED",
      matchedTransactionLineId: transactionLineId,
      reconciledAt:             new Date(),
    },
  });
}

export async function unmatchBankTransaction(bankTransactionId: string) {
  return prisma.accBankTransaction.update({
    where: { id: bankTransactionId },
    data: {
      status:                   "PENDING",
      matchedTransactionLineId: null,
      reconciledAt:             null,
    },
  });
}

export async function autoReconcile(bankAccountId: string) {
  const bankTxns = await prisma.accBankTransaction.findMany({
    where: { bankAccountId, status: "PENDING" },
  });

  let matched = 0;
  for (const bt of bankTxns) {
    const matchingLine = await prisma.accTransactionLine.findFirst({
      where: {
        debitAmount: { gte: new Prisma.Decimal(Math.abs(Number(bt.amount)) - 0.01) },
        creditAmount: { gte: new Prisma.Decimal(0) },
        transaction: {
          status: "POSTED",
          date: {
            gte: new Date(bt.date.getTime() - 3 * 24 * 60 * 60 * 1000),
            lte: new Date(bt.date.getTime() + 3 * 24 * 60 * 60 * 1000),
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    if (matchingLine) {
      await matchBankTransaction(bt.id, matchingLine.id);
      matched++;
    }
  }

  await prisma.accBankAccount.update({
    where: { id: bankAccountId },
    data: { lastReconciledAt: new Date() },
  });

  return { matched, total: bankTxns.length };
}
