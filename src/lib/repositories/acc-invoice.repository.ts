import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { createTransaction } from "./acc-transaction.repository";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export interface InvoiceLineInput {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  accountId?: string;
}

export interface CreateInvoiceInput {
  customerName: string;
  customerEmail?: string;
  customerAddress?: string;
  issueDate: Date;
  dueDate: Date;
  notes?: string;
  currency?: string;
  createdById?: string;
  lines: InvoiceLineInput[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

async function getNextInvoiceNumber(organizationId: string): Promise<string> {
  const count = await prisma.accInvoice.count({ where: { organizationId } });
  const year = new Date().getFullYear();
  return `INV-${year}-${String(count + 1).padStart(5, "0")}`;
}

function calcLineTotals(lines: InvoiceLineInput[]) {
  let subtotal = 0;
  let tax = 0;
  const computed = lines.map((l) => {
    const amount  = l.quantity * l.unitPrice;
    const taxAmt  = amount * ((l.taxRate ?? 0) / 100);
    subtotal += amount;
    tax      += taxAmt;
    return { ...l, amount, taxAmt };
  });
  return { computed, subtotal, tax, total: subtotal + tax };
}

/* ------------------------------------------------------------------ */
/*  Queries                                                             */
/* ------------------------------------------------------------------ */

export async function listInvoices(
  organizationId: string,
  filters: {
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
    search?: string;
    page?: number;
    limit?: number;
  }
) {
  const page  = filters.page  ?? 1;
  const limit = filters.limit ?? 20;
  const where: Prisma.AccInvoiceWhereInput = {
    organizationId,
    ...(filters.status   && { status: filters.status as never }),
    ...(filters.dateFrom && { issueDate: { gte: filters.dateFrom } }),
    ...(filters.dateTo   && { issueDate: { lte: filters.dateTo   } }),
    ...(filters.search   && {
      OR: [
        { customerName:  { contains: filters.search, mode: "insensitive" } },
        { invoiceNumber: { contains: filters.search, mode: "insensitive" } },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    prisma.accInvoice.findMany({
      where,
      orderBy: { issueDate: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.accInvoice.count({ where }),
  ]);
  return { data, total, page, limit };
}

export async function getInvoiceById(organizationId: string, id: string) {
  return prisma.accInvoice.findFirst({
    where: { id, organizationId },
    include: { lines: { include: { account: { select: { code: true, name: true } } } } },
  });
}

export async function getInvoiceStats(organizationId: string) {
  const [draft, sent, paid, overdue, partiallyPaid] = await Promise.all([
    prisma.accInvoice.aggregate({ where: { organizationId, status: "DRAFT"          }, _count: true, _sum: { totalAmount: true } }),
    prisma.accInvoice.aggregate({ where: { organizationId, status: "SENT"           }, _count: true, _sum: { totalAmount: true } }),
    prisma.accInvoice.aggregate({ where: { organizationId, status: "PAID"           }, _count: true, _sum: { totalAmount: true } }),
    prisma.accInvoice.aggregate({ where: { organizationId, status: "OVERDUE"        }, _count: true, _sum: { totalAmount: true } }),
    prisma.accInvoice.aggregate({ where: { organizationId, status: "PARTIALLY_PAID" }, _count: true, _sum: { totalAmount: true } }),
  ]);
  const totalReceivable =
    Number(sent._sum.totalAmount ?? 0) +
    Number(overdue._sum.totalAmount ?? 0) +
    Number(partiallyPaid._sum.totalAmount ?? 0);

  return { draft, sent, paid, overdue, partiallyPaid, totalReceivable };
}

export async function getOverdueInvoices(organizationId: string) {
  return prisma.accInvoice.findMany({
    where: {
      organizationId,
      status: { in: ["SENT", "PARTIALLY_PAID"] },
      dueDate: { lt: new Date() },
    },
    orderBy: { dueDate: "asc" },
    take: 10,
  });
}

/* ------------------------------------------------------------------ */
/*  Mutations                                                           */
/* ------------------------------------------------------------------ */

export async function createInvoice(
  organizationId: string,
  data: CreateInvoiceInput
) {
  const invoiceNumber = await getNextInvoiceNumber(organizationId);
  const { computed, subtotal, tax, total } = calcLineTotals(data.lines);

  return prisma.accInvoice.create({
    data: {
      organizationId,
      invoiceNumber,
      customerName:    data.customerName,
      customerEmail:   data.customerEmail   ?? null,
      customerAddress: data.customerAddress ?? null,
      issueDate:       data.issueDate,
      dueDate:         data.dueDate,
      notes:           data.notes           ?? null,
      currency:        data.currency        ?? "PHP",
      createdById:     data.createdById     ?? null,
      subtotalAmount:  new Prisma.Decimal(subtotal),
      taxAmount:       new Prisma.Decimal(tax),
      totalAmount:     new Prisma.Decimal(total),
      status: "DRAFT",
      lines: {
        create: computed.map((l) => ({
          description: l.description,
          quantity:    new Prisma.Decimal(l.quantity),
          unitPrice:   new Prisma.Decimal(l.unitPrice),
          amount:      new Prisma.Decimal(l.amount),
          taxRate:     new Prisma.Decimal(l.taxRate ?? 0),
          accountId:   l.accountId ?? null,
        })),
      },
    },
    include: { lines: true },
  });
}

export async function updateInvoice(
  organizationId: string,
  id: string,
  data: Partial<CreateInvoiceInput>
) {
  const invoice = await prisma.accInvoice.findFirst({ where: { id, organizationId } });
  if (!invoice) throw new Error("Invoice not found");
  if (invoice.status !== "DRAFT") throw new Error("Only DRAFT invoices can be edited");

  const lines = data.lines ? calcLineTotals(data.lines) : null;
  return prisma.accInvoice.update({
    where: { id },
    data: {
      ...(data.customerName    && { customerName: data.customerName }),
      ...(data.customerEmail   && { customerEmail: data.customerEmail }),
      ...(data.customerAddress && { customerAddress: data.customerAddress }),
      ...(data.issueDate       && { issueDate: data.issueDate }),
      ...(data.dueDate         && { dueDate: data.dueDate }),
      ...(data.notes           && { notes: data.notes }),
      ...(lines && {
        subtotalAmount: new Prisma.Decimal(lines.subtotal),
        taxAmount:      new Prisma.Decimal(lines.tax),
        totalAmount:    new Prisma.Decimal(lines.total),
        lines: {
          deleteMany: {},
          create: lines.computed.map((l) => ({
            description: l.description,
            quantity:    new Prisma.Decimal(l.quantity),
            unitPrice:   new Prisma.Decimal(l.unitPrice),
            amount:      new Prisma.Decimal(l.amount),
            taxRate:     new Prisma.Decimal(l.taxRate ?? 0),
            accountId:   l.accountId ?? null,
          })),
        },
      }),
    },
  });
}

export async function sendInvoice(organizationId: string, id: string) {
  const invoice = await prisma.accInvoice.findFirst({ where: { id, organizationId } });
  if (!invoice) throw new Error("Invoice not found");
  if (invoice.status !== "DRAFT") throw new Error("Only DRAFT invoices can be sent");
  return prisma.accInvoice.update({ where: { id }, data: { status: "SENT" } });
}

export async function recordPayment(
  organizationId: string,
  id: string,
  amount: number,
  paymentAccountId: string,
  receivableAccountId: string,
  userId?: string
) {
  const invoice = await prisma.accInvoice.findFirst({ where: { id, organizationId } });
  if (!invoice) throw new Error("Invoice not found");
  if (!["SENT", "PARTIALLY_PAID", "OVERDUE"].includes(invoice.status)) {
    throw new Error("Invoice is not in a payable state");
  }

  const newPaid  = Number(invoice.paidAmount) + amount;
  const newStatus = newPaid >= Number(invoice.totalAmount) ? "PAID" : "PARTIALLY_PAID";

  const txn = await createTransaction(organizationId, {
    date:        new Date(),
    description: `Payment received — ${invoice.invoiceNumber}`,
    sourceType:  "INVOICE",
    sourceId:    id,
    createdById: userId,
    lines: [
      { accountId: paymentAccountId,   debitAmount: amount, creditAmount: 0      },
      { accountId: receivableAccountId, debitAmount: 0,     creditAmount: amount },
    ],
  });

  return prisma.accInvoice.update({
    where: { id },
    data: {
      paidAmount:   new Prisma.Decimal(newPaid),
      status:       newStatus,
      paidAt:       newStatus === "PAID" ? new Date() : null,
      transactionId: txn.id,
    },
  });
}

export async function voidInvoice(
  organizationId: string,
  id: string,
  _reason: string
) {
  const invoice = await prisma.accInvoice.findFirst({ where: { id, organizationId } });
  if (!invoice) throw new Error("Invoice not found");
  if (invoice.status === "VOIDED") throw new Error("Already voided");
  return prisma.accInvoice.update({ where: { id }, data: { status: "VOIDED" } });
}
