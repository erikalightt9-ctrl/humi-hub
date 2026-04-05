import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

async function getAccountBalances(
  organizationId: string,
  types: string[],
  dateFrom?: Date,
  dateTo?: Date
) {
  const accounts = await prisma.accAccount.findMany({
    where: { organizationId, type: { in: types as never[] }, isActive: true },
    orderBy: { code: "asc" },
  });

  return Promise.all(
    accounts.map(async (acc) => {
      const where = {
        accountId: acc.id,
        transaction: {
          organizationId,
          status: "POSTED" as const,
          ...(dateFrom && { date: { gte: dateFrom } }),
          ...(dateTo   && { date: { lte: dateTo   } }),
        },
      };
      const agg = await prisma.accTransactionLine.aggregate({
        where,
        _sum: { debitAmount: true, creditAmount: true },
      });
      const debit  = Number(agg._sum.debitAmount  ?? 0);
      const credit = Number(agg._sum.creditAmount ?? 0);
      const balance =
        acc.normalBalance === "DEBIT" ? debit - credit : credit - debit;
      return { ...acc, debit, credit, balance };
    })
  );
}

/* ------------------------------------------------------------------ */
/*  Reports                                                             */
/* ------------------------------------------------------------------ */

export async function getProfitAndLoss(
  organizationId: string,
  dateFrom: Date,
  dateTo: Date
) {
  const [revenues, expenses] = await Promise.all([
    getAccountBalances(organizationId, ["REVENUE"], dateFrom, dateTo),
    getAccountBalances(organizationId, ["EXPENSE"], dateFrom, dateTo),
  ]);

  const totalRevenue  = revenues.reduce((s, a) => s + a.balance, 0);
  const totalExpense  = expenses.reduce((s, a) => s + a.balance, 0);
  const netIncome     = totalRevenue - totalExpense;

  return { revenues, expenses, totalRevenue, totalExpense, netIncome, dateFrom, dateTo };
}

export async function getBalanceSheet(organizationId: string, asOfDate: Date) {
  const [assets, liabilities, equity] = await Promise.all([
    getAccountBalances(organizationId, ["ASSET"],     undefined, asOfDate),
    getAccountBalances(organizationId, ["LIABILITY"],  undefined, asOfDate),
    getAccountBalances(organizationId, ["EQUITY"],     undefined, asOfDate),
  ]);

  const totalAssets       = assets.reduce((s, a) => s + a.balance, 0);
  const totalLiabilities  = liabilities.reduce((s, a) => s + a.balance, 0);
  const totalEquity       = equity.reduce((s, a) => s + a.balance, 0);

  return { assets, liabilities, equity, totalAssets, totalLiabilities, totalEquity, asOfDate };
}

export async function getCashFlowStatement(
  organizationId: string,
  dateFrom: Date,
  dateTo: Date
) {
  // Simplified: all cash/bank account movements
  const cashAccounts = await prisma.accAccount.findMany({
    where: { organizationId, type: "ASSET", code: { in: ["1000", "1010"] } },
  });

  const movements = await Promise.all(
    cashAccounts.map(async (acc) => {
      const agg = await prisma.accTransactionLine.aggregate({
        where: {
          accountId: acc.id,
          transaction: {
            organizationId,
            status: "POSTED",
            date: { gte: dateFrom, lte: dateTo },
          },
        },
        _sum: { debitAmount: true, creditAmount: true },
      });
      const inflow  = Number(agg._sum.debitAmount  ?? 0);
      const outflow = Number(agg._sum.creditAmount ?? 0);
      return { ...acc, inflow, outflow, net: inflow - outflow };
    })
  );

  const totalInflow  = movements.reduce((s, m) => s + m.inflow,  0);
  const totalOutflow = movements.reduce((s, m) => s + m.outflow, 0);
  const netCashFlow  = totalInflow - totalOutflow;

  return { movements, totalInflow, totalOutflow, netCashFlow, dateFrom, dateTo };
}

export async function getTrialBalance(organizationId: string, asOfDate: Date) {
  const accounts = await prisma.accAccount.findMany({
    where: { organizationId, isActive: true },
    orderBy: { code: "asc" },
  });

  const rows = await Promise.all(
    accounts.map(async (acc) => {
      const agg = await prisma.accTransactionLine.aggregate({
        where: {
          accountId: acc.id,
          transaction: { organizationId, status: "POSTED", date: { lte: asOfDate } },
        },
        _sum: { debitAmount: true, creditAmount: true },
      });
      return {
        ...acc,
        totalDebit:  Number(agg._sum.debitAmount  ?? 0),
        totalCredit: Number(agg._sum.creditAmount ?? 0),
      };
    })
  );

  const totalDebit  = rows.reduce((s, r) => s + r.totalDebit,  0);
  const totalCredit = rows.reduce((s, r) => s + r.totalCredit, 0);

  return { rows, totalDebit, totalCredit, balanced: Math.abs(totalDebit - totalCredit) < 0.01, asOfDate };
}

export async function getGeneralLedger(
  organizationId: string,
  accountId: string,
  dateFrom: Date,
  dateTo: Date
) {
  const account = await prisma.accAccount.findFirst({ where: { id: accountId, organizationId } });
  if (!account) throw new Error("Account not found");

  const lines = await prisma.accTransactionLine.findMany({
    where: {
      accountId,
      transaction: {
        organizationId,
        status: "POSTED",
        date: { gte: dateFrom, lte: dateTo },
      },
    },
    include: { transaction: { select: { transactionNumber: true, date: true, description: true } } },
    orderBy: { transaction: { date: "asc" } },
  });

  let runningBalance = 0;
  const entries = lines.map((l) => {
    const debit  = Number(l.debitAmount);
    const credit = Number(l.creditAmount);
    runningBalance += account.normalBalance === "DEBIT" ? debit - credit : credit - debit;
    return { ...l, debit, credit, runningBalance };
  });

  return { account, entries, dateFrom, dateTo };
}

export async function getAccountsReceivableSummary(organizationId: string) {
  return prisma.accInvoice.groupBy({
    by: ["status"],
    where: { organizationId, status: { in: ["SENT", "PARTIALLY_PAID", "OVERDUE"] } },
    _count: true,
    _sum: { totalAmount: true, paidAmount: true },
  });
}

export async function getAccountsPayableSummary(organizationId: string) {
  return prisma.accExpense.groupBy({
    by: ["status"],
    where: { organizationId, status: { in: ["SUBMITTED", "APPROVED"] } },
    _count: true,
    _sum: { totalAmount: true },
  });
}

export async function getDashboardStats(organizationId: string) {
  const now     = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [invoiceStats, expenseStats, overdue, flags] = await Promise.all([
    prisma.accInvoice.aggregate({
      where: { organizationId, status: { in: ["SENT", "PARTIALLY_PAID", "OVERDUE"] } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.accExpense.aggregate({
      where: { organizationId, status: "APPROVED", expenseDate: { gte: thisMonth } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.accInvoice.count({
      where: { organizationId, status: "OVERDUE" },
    }),
    prisma.accForensicFlag.count({
      where: { organizationId, isResolved: false },
    }),
  ]);

  return {
    totalReceivable: Number(invoiceStats._sum.totalAmount ?? 0),
    openInvoices:    invoiceStats._count,
    monthlyExpenses: Number(expenseStats._sum.totalAmount ?? 0),
    overdueInvoices: overdue,
    unresolvedFlags: flags,
  };
}
