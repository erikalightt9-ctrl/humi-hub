import { prisma } from "@/lib/prisma";
import type { AccAccountType } from "@prisma/client";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export interface CreateAccountInput {
  code: string;
  name: string;
  type: AccAccountType;
  parentId?: string;
  description?: string;
  currency?: string;
}

export interface UpdateAccountInput {
  name?: string;
  description?: string;
  isActive?: boolean;
  currency?: string;
}

/* ------------------------------------------------------------------ */
/*  Queries                                                             */
/* ------------------------------------------------------------------ */

export async function getChartOfAccounts(
  organizationId: string,
  filters?: { type?: AccAccountType; isActive?: boolean }
) {
  return prisma.accAccount.findMany({
    where: {
      organizationId,
      ...(filters?.type !== undefined && { type: filters.type }),
      ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
    },
    orderBy: [{ type: "asc" }, { code: "asc" }],
    select: {
      id: true,
      code: true,
      name: true,
      type: true,
      normalBalance: true,
      parentId: true,
      description: true,
      isActive: true,
      isSystemAccount: true,
      currency: true,
      createdAt: true,
    },
  });
}

export async function getAccountById(organizationId: string, id: string) {
  return prisma.accAccount.findFirst({
    where: { id, organizationId },
    include: { children: true, parent: true },
  });
}

export async function getAccountBalance(
  organizationId: string,
  accountId: string,
  asOfDate?: Date
): Promise<{ debit: number; credit: number; balance: number }> {
  const account = await prisma.accAccount.findFirst({
    where: { id: accountId, organizationId },
    select: { normalBalance: true },
  });
  if (!account) throw new Error("Account not found");

  const dateFilter = asOfDate
    ? { date: { lte: asOfDate } }
    : {};

  const agg = await prisma.accTransactionLine.aggregate({
    where: {
      accountId,
      transaction: { organizationId, status: "POSTED", ...dateFilter },
    },
    _sum: { debitAmount: true, creditAmount: true },
  });

  const debit = Number(agg._sum.debitAmount ?? 0);
  const credit = Number(agg._sum.creditAmount ?? 0);
  const balance =
    account.normalBalance === "DEBIT" ? debit - credit : credit - debit;

  return { debit, credit, balance };
}

/* ------------------------------------------------------------------ */
/*  Mutations                                                           */
/* ------------------------------------------------------------------ */

export async function createAccount(
  organizationId: string,
  data: CreateAccountInput
) {
  const normalBalance =
    data.type === "ASSET" || data.type === "EXPENSE" ? "DEBIT" : "CREDIT";

  return prisma.accAccount.create({
    data: {
      organizationId,
      code: data.code.trim().toUpperCase(),
      name: data.name.trim(),
      type: data.type,
      normalBalance,
      parentId: data.parentId ?? null,
      description: data.description ?? null,
      currency: data.currency ?? "PHP",
    },
  });
}

export async function updateAccount(
  organizationId: string,
  id: string,
  data: UpdateAccountInput
) {
  return prisma.accAccount.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.currency !== undefined && { currency: data.currency }),
    },
  });
}

export async function deactivateAccount(organizationId: string, id: string) {
  const linked = await prisma.accTransactionLine.count({
    where: { accountId: id },
  });
  if (linked > 0) throw new Error("Cannot deactivate account with linked transactions");
  return prisma.accAccount.update({ where: { id }, data: { isActive: false } });
}

/* ------------------------------------------------------------------ */
/*  Seed Default Chart of Accounts                                     */
/* ------------------------------------------------------------------ */

const DEFAULT_ACCOUNTS: Omit<CreateAccountInput, "parentId">[] = [
  // Assets
  { code: "1000", name: "Cash on Hand",          type: "ASSET"     },
  { code: "1010", name: "Cash in Bank",           type: "ASSET"     },
  { code: "1100", name: "Accounts Receivable",    type: "ASSET"     },
  { code: "1200", name: "Prepaid Expenses",       type: "ASSET"     },
  { code: "1500", name: "Fixed Assets",           type: "ASSET"     },
  // Liabilities
  { code: "2000", name: "Accounts Payable",       type: "LIABILITY" },
  { code: "2100", name: "Accrued Liabilities",    type: "LIABILITY" },
  { code: "2500", name: "Loans Payable",          type: "LIABILITY" },
  // Equity
  { code: "3000", name: "Owner's Equity",         type: "EQUITY"    },
  { code: "3100", name: "Retained Earnings",      type: "EQUITY"    },
  // Revenue
  { code: "4000", name: "Sales Revenue",          type: "REVENUE"   },
  { code: "4100", name: "Service Revenue",        type: "REVENUE"   },
  { code: "4900", name: "Other Income",           type: "REVENUE"   },
  // Expenses
  { code: "5000", name: "Cost of Goods Sold",     type: "EXPENSE"   },
  { code: "5100", name: "Salaries & Wages",       type: "EXPENSE"   },
  { code: "5200", name: "Rent Expense",           type: "EXPENSE"   },
  { code: "5300", name: "Utilities Expense",      type: "EXPENSE"   },
  { code: "5400", name: "Office Supplies",        type: "EXPENSE"   },
  { code: "5500", name: "Marketing & Advertising",type: "EXPENSE"   },
  { code: "5600", name: "Professional Fees",      type: "EXPENSE"   },
  { code: "5900", name: "Other Expenses",         type: "EXPENSE"   },
];

export async function seedDefaultAccounts(organizationId: string) {
  const existing = await prisma.accAccount.count({ where: { organizationId } });
  if (existing > 0) throw new Error("Chart of accounts already seeded");

  const data = DEFAULT_ACCOUNTS.map((a) => ({
    organizationId,
    code: a.code,
    name: a.name,
    type: a.type,
    normalBalance: (a.type === "ASSET" || a.type === "EXPENSE" ? "DEBIT" : "CREDIT") as "DEBIT" | "CREDIT",
    isSystemAccount: true,
    currency: "PHP",
  }));

  return prisma.accAccount.createMany({ data });
}
