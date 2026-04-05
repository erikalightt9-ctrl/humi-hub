import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { createTransaction, postTransaction } from "./acc-transaction.repository";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export interface CreateExpenseInput {
  vendor: string;
  description: string;
  category: string;
  amount: number;
  taxAmount?: number;
  currency?: string;
  expenseDate: Date;
  receiptUrl?: string;
  accountId?: string;
  paymentAccountId?: string;
  submittedById?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

async function getNextExpenseNumber(organizationId: string): Promise<string> {
  const count = await prisma.accExpense.count({ where: { organizationId } });
  const year = new Date().getFullYear();
  return `EXP-${year}-${String(count + 1).padStart(5, "0")}`;
}

/* ------------------------------------------------------------------ */
/*  Queries                                                             */
/* ------------------------------------------------------------------ */

export async function listExpenses(
  organizationId: string,
  filters: {
    status?: string;
    category?: string;
    dateFrom?: Date;
    dateTo?: Date;
    search?: string;
    page?: number;
    limit?: number;
  }
) {
  const page  = filters.page  ?? 1;
  const limit = filters.limit ?? 20;
  const where: Prisma.AccExpenseWhereInput = {
    organizationId,
    ...(filters.status   && { status: filters.status as never }),
    ...(filters.category && { category: filters.category }),
    ...(filters.dateFrom && { expenseDate: { gte: filters.dateFrom } }),
    ...(filters.dateTo   && { expenseDate: { lte: filters.dateTo   } }),
    ...(filters.search   && {
      OR: [
        { vendor:        { contains: filters.search, mode: "insensitive" } },
        { description:   { contains: filters.search, mode: "insensitive" } },
        { expenseNumber: { contains: filters.search, mode: "insensitive" } },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    prisma.accExpense.findMany({
      where,
      orderBy: { expenseDate: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.accExpense.count({ where }),
  ]);
  return { data, total, page, limit };
}

export async function getExpenseById(organizationId: string, id: string) {
  return prisma.accExpense.findFirst({
    where: { id, organizationId },
    include: {
      account:        { select: { code: true, name: true } },
      paymentAccount: { select: { code: true, name: true } },
    },
  });
}

export async function getExpenseStats(organizationId: string) {
  const [byStatus, byCategory] = await Promise.all([
    prisma.accExpense.groupBy({
      by: ["status"],
      where: { organizationId },
      _count: true,
      _sum: { totalAmount: true },
    }),
    prisma.accExpense.groupBy({
      by: ["category"],
      where: { organizationId, status: "APPROVED" },
      _sum: { totalAmount: true },
      orderBy: { _sum: { totalAmount: "desc" } },
      take: 10,
    }),
  ]);
  return { byStatus, byCategory };
}

/* ------------------------------------------------------------------ */
/*  Mutations                                                           */
/* ------------------------------------------------------------------ */

export async function createExpense(
  organizationId: string,
  data: CreateExpenseInput
) {
  const expenseNumber = await getNextExpenseNumber(organizationId);
  const tax   = data.taxAmount ?? 0;
  const total = data.amount + tax;

  return prisma.accExpense.create({
    data: {
      organizationId,
      expenseNumber,
      vendor:          data.vendor,
      description:     data.description,
      category:        data.category,
      amount:          new Prisma.Decimal(data.amount),
      taxAmount:       new Prisma.Decimal(tax),
      totalAmount:     new Prisma.Decimal(total),
      currency:        data.currency        ?? "PHP",
      expenseDate:     data.expenseDate,
      receiptUrl:      data.receiptUrl      ?? null,
      accountId:       data.accountId       ?? null,
      paymentAccountId:data.paymentAccountId ?? null,
      submittedById:   data.submittedById   ?? null,
      status: "DRAFT",
    },
  });
}

export async function updateExpense(
  organizationId: string,
  id: string,
  data: Partial<CreateExpenseInput>
) {
  const expense = await prisma.accExpense.findFirst({ where: { id, organizationId } });
  if (!expense) throw new Error("Expense not found");
  if (!["DRAFT", "SUBMITTED"].includes(expense.status)) {
    throw new Error("Cannot edit expense in current status");
  }

  const tax   = data.taxAmount ?? Number(expense.taxAmount);
  const amt   = data.amount    ?? Number(expense.amount);
  const total = amt + tax;

  return prisma.accExpense.update({
    where: { id },
    data: {
      ...(data.vendor      && { vendor: data.vendor }),
      ...(data.description && { description: data.description }),
      ...(data.category    && { category: data.category }),
      amount:      new Prisma.Decimal(amt),
      taxAmount:   new Prisma.Decimal(tax),
      totalAmount: new Prisma.Decimal(total),
      ...(data.expenseDate     && { expenseDate: data.expenseDate }),
      ...(data.receiptUrl      && { receiptUrl: data.receiptUrl }),
      ...(data.accountId       && { accountId: data.accountId }),
      ...(data.paymentAccountId && { paymentAccountId: data.paymentAccountId }),
    },
  });
}

export async function approveExpense(
  organizationId: string,
  id: string,
  approverId: string
) {
  const expense = await prisma.accExpense.findFirst({ where: { id, organizationId } });
  if (!expense) throw new Error("Expense not found");
  if (expense.status !== "SUBMITTED") throw new Error("Only SUBMITTED expenses can be approved");

  let transactionId: string | null = null;

  if (expense.accountId && expense.paymentAccountId) {
    const txn = await createTransaction(organizationId, {
      date:        expense.expenseDate,
      description: `Expense approved — ${expense.expenseNumber}: ${expense.description}`,
      sourceType:  "EXPENSE",
      sourceId:    id,
      createdById: approverId,
      lines: [
        { accountId: expense.accountId,        debitAmount: Number(expense.totalAmount), creditAmount: 0 },
        { accountId: expense.paymentAccountId, debitAmount: 0, creditAmount: Number(expense.totalAmount) },
      ],
    });
    await postTransaction(organizationId, txn.id, approverId);
    transactionId = txn.id;
  }

  return prisma.accExpense.update({
    where: { id },
    data: {
      status:       "APPROVED",
      approvedById: approverId,
      approvedAt:   new Date(),
      transactionId,
    },
  });
}

export async function rejectExpense(
  organizationId: string,
  id: string,
  reason: string
) {
  const expense = await prisma.accExpense.findFirst({ where: { id, organizationId } });
  if (!expense) throw new Error("Expense not found");
  if (!["SUBMITTED", "DRAFT"].includes(expense.status)) {
    throw new Error("Expense cannot be rejected in current status");
  }
  return prisma.accExpense.update({
    where: { id },
    data: { status: "REJECTED", rejectedReason: reason },
  });
}
