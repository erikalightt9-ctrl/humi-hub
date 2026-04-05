import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

async function upsertFlag(data: {
  organizationId: string;
  ruleCode: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  entityType: string;
  entityId: string;
  description: string;
  details?: Record<string, unknown>;
}) {
  const existing = await prisma.accForensicFlag.findFirst({
    where: {
      organizationId: data.organizationId,
      ruleCode:   data.ruleCode,
      entityType: data.entityType,
      entityId:   data.entityId,
      isResolved: false,
    },
  });
  if (existing) return existing;
  return prisma.accForensicFlag.create({
    data: {
      organizationId: data.organizationId,
      ruleCode:   data.ruleCode,
      severity:   data.severity,
      entityType: data.entityType,
      entityId:   data.entityId,
      description:data.description,
      details:    data.details ? (data.details as object) : undefined,
      isResolved: false,
    },
  });
}

/* ------------------------------------------------------------------ */
/*  Forensic Checks                                                     */
/* ------------------------------------------------------------------ */

export async function runDuplicateInvoiceCheck(organizationId: string) {
  const invoices = await prisma.accInvoice.findMany({
    where: { organizationId, status: { notIn: ["VOIDED", "CANCELLED"] } },
    select: { id: true, invoiceNumber: true, customerName: true, totalAmount: true, issueDate: true },
  });

  const groups = new Map<string, typeof invoices>();
  for (const inv of invoices) {
    const key = `${inv.customerName.toLowerCase()}-${Number(inv.totalAmount).toFixed(2)}-${inv.issueDate.toISOString().slice(0, 10)}`;
    const g = groups.get(key) ?? [];
    g.push(inv);
    groups.set(key, g);
  }

  let flagged = 0;
  for (const group of groups.values()) {
    if (group.length > 1) {
      for (const inv of group) {
        await upsertFlag({
          organizationId,
          ruleCode:   "DUPLICATE_INVOICE",
          severity:   "HIGH",
          entityType: "invoice",
          entityId:   inv.id,
          description: `Possible duplicate invoice: same customer, amount, and date as ${group.length - 1} other(s)`,
          details:    { duplicateIds: group.map((i) => i.id) },
        });
        flagged++;
      }
    }
  }
  return { checked: invoices.length, flagged };
}

export async function runRoundNumberCheck(organizationId: string) {
  const txns = await prisma.accTransaction.findMany({
    where: { organizationId, status: "POSTED" },
    include: { lines: { select: { debitAmount: true } } },
  });

  let flagged = 0;
  for (const txn of txns) {
    const total = txn.lines.reduce((s, l) => s + Number(l.debitAmount), 0);
    const isRound = total >= 1000 && total % 1000 === 0;
    if (isRound) {
      await upsertFlag({
        organizationId,
        ruleCode:   "ROUND_NUMBER",
        severity:   "LOW",
        entityType: "transaction",
        entityId:   txn.id,
        description: `Transaction amount ₱${total.toLocaleString()} is a suspiciously round number`,
        details:    { amount: total },
      });
      flagged++;
    }
  }
  return { checked: txns.length, flagged };
}

export async function runBenfordAnalysis(organizationId: string) {
  // Expected Benford leading-digit distribution
  const BENFORD = [0, 0.301, 0.176, 0.125, 0.097, 0.079, 0.067, 0.058, 0.051, 0.046];

  const lines = await prisma.accTransactionLine.findMany({
    where: { transaction: { organizationId, status: "POSTED" } },
    select: { debitAmount: true, transactionId: true },
  });

  const counts = Array(10).fill(0);
  for (const l of lines) {
    const amt = Number(l.debitAmount);
    if (amt <= 0) continue;
    const digit = parseInt(amt.toString().replace(/[^1-9]/, "")[0], 10);
    if (digit >= 1 && digit <= 9) counts[digit]++;
  }

  const total = counts.reduce((s, c) => s + c, 0);
  if (total < 100) return { checked: total, flagged: 0, note: "Insufficient data for Benford analysis" };

  let flagged = 0;
  for (let d = 1; d <= 9; d++) {
    const observed = counts[d] / total;
    const expected = BENFORD[d];
    const deviation = Math.abs(observed - expected) / expected;
    if (deviation > 0.25) {
      await upsertFlag({
        organizationId,
        ruleCode:   "BENFORD_ANOMALY",
        severity:   deviation > 0.5 ? "HIGH" : "MEDIUM",
        entityType: "organization",
        entityId:   organizationId,
        description: `Digit ${d} appears ${(observed * 100).toFixed(1)}% (expected ${(expected * 100).toFixed(1)}%) — ${(deviation * 100).toFixed(0)}% deviation from Benford's Law`,
        details:    { digit: d, observed, expected, deviation, total },
      });
      flagged++;
    }
  }
  return { checked: total, flagged };
}

export async function runSplitThresholdCheck(
  organizationId: string,
  threshold = 10000
) {
  const windowMs = 3 * 24 * 60 * 60 * 1000;
  const expenses = await prisma.accExpense.findMany({
    where: { organizationId, status: { notIn: ["REJECTED", "VOIDED"] } },
    orderBy: { expenseDate: "asc" },
  });

  let flagged = 0;
  for (let i = 0; i < expenses.length; i++) {
    const base = expenses[i];
    if (Number(base.totalAmount) >= threshold) continue;

    const cluster = expenses.filter(
      (e) =>
        e.id !== base.id &&
        e.vendor.toLowerCase() === base.vendor.toLowerCase() &&
        Math.abs(e.expenseDate.getTime() - base.expenseDate.getTime()) <= windowMs &&
        Number(e.totalAmount) < threshold
    );

    const clusterTotal = Number(base.totalAmount) + cluster.reduce((s, e) => s + Number(e.totalAmount), 0);
    if (cluster.length > 0 && clusterTotal >= threshold) {
      await upsertFlag({
        organizationId,
        ruleCode:   "SPLIT_THRESHOLD",
        severity:   "MEDIUM",
        entityType: "expense",
        entityId:   base.id,
        description: `Possible expense splitting — ${cluster.length + 1} expenses to "${base.vendor}" totalling ₱${clusterTotal.toLocaleString()} within 3 days`,
        details:    { clusterIds: [base.id, ...cluster.map((e) => e.id)], total: clusterTotal, threshold },
      });
      flagged++;
    }
  }
  return { checked: expenses.length, flagged };
}

/* ------------------------------------------------------------------ */
/*  Queries                                                             */
/* ------------------------------------------------------------------ */

export async function listForensicFlags(
  organizationId: string,
  filters: {
    isResolved?: boolean;
    severity?: string;
    ruleCode?: string;
    page?: number;
    limit?: number;
  }
) {
  const page  = filters.page  ?? 1;
  const limit = filters.limit ?? 20;
  const where: Prisma.AccForensicFlagWhereInput = {
    organizationId,
    ...(filters.isResolved !== undefined && { isResolved: filters.isResolved }),
    ...(filters.severity   && { severity: filters.severity as never }),
    ...(filters.ruleCode   && { ruleCode: filters.ruleCode }),
  };

  const [data, total] = await Promise.all([
    prisma.accForensicFlag.findMany({
      where,
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.accForensicFlag.count({ where }),
  ]);
  return { data, total, page, limit };
}

export async function resolveFlag(
  organizationId: string,
  id: string,
  userId: string,
  note: string
) {
  const flag = await prisma.accForensicFlag.findFirst({ where: { id, organizationId } });
  if (!flag) throw new Error("Flag not found");
  return prisma.accForensicFlag.update({
    where: { id },
    data: { isResolved: true, resolvedById: userId, resolvedAt: new Date(), resolvedNote: note },
  });
}

export async function getForensicSummary(organizationId: string) {
  const [bySeverity, byRule] = await Promise.all([
    prisma.accForensicFlag.groupBy({
      by: ["severity"],
      where: { organizationId, isResolved: false },
      _count: true,
    }),
    prisma.accForensicFlag.groupBy({
      by: ["ruleCode"],
      where: { organizationId, isResolved: false },
      _count: true,
    }),
  ]);
  return { bySeverity, byRule };
}
