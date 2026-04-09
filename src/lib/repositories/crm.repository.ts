import { prisma } from "@/lib/prisma";
import { CrmDealStage, CrmActivityType, CrmContactType, Prisma } from "@prisma/client";

/* ================================================================== */
/*  Input Types                                                         */
/* ================================================================== */

export interface CreateContactInput {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  contactType?: CrmContactType;
  notes?: string;
  createdById?: string;
}

export interface UpdateContactInput {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  contactType?: CrmContactType;
  notes?: string;
}

export interface CreateDealInput {
  title: string;
  value?: number;
  currency?: string;
  stage?: CrmDealStage;
  probability?: number;
  expectedCloseDate?: Date;
  contactId?: string;
  notes?: string;
  createdById?: string;
}

export interface UpdateDealInput {
  title?: string;
  value?: number;
  currency?: string;
  stage?: CrmDealStage;
  probability?: number;
  expectedCloseDate?: Date;
  contactId?: string;
  notes?: string;
}

export interface CreateActivityInput {
  activityType: CrmActivityType;
  subject: string;
  body?: string;
  dealId?: string;
  contactId?: string;
  createdById?: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  dueDate?: Date;
  dealId?: string;
  assignedToId?: string;
  createdById?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  dueDate?: Date;
  isDone?: boolean;
  assignedToId?: string;
}

/* ================================================================== */
/*  Contacts                                                            */
/* ================================================================== */

export async function listContacts(
  orgId: string,
  filters: {
    search?: string;
    contactType?: CrmContactType;
    page?: number;
    limit?: number;
  }
) {
  const page  = filters.page  ?? 1;
  const limit = filters.limit ?? 20;

  const where: Prisma.CrmContactWhereInput = {
    organizationId: orgId,
    ...(filters.contactType && { contactType: filters.contactType }),
    ...(filters.search && {
      OR: [
        { name:    { contains: filters.search, mode: "insensitive" } },
        { email:   { contains: filters.search, mode: "insensitive" } },
        { company: { contains: filters.search, mode: "insensitive" } },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    prisma.crmContact.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.crmContact.count({ where }),
  ]);

  return { data, total, page, limit };
}

export async function getContactById(orgId: string, id: string) {
  return prisma.crmContact.findFirst({
    where: { id, organizationId: orgId },
    include: {
      deals: {
        orderBy: { createdAt: "desc" },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
}

export async function createContact(orgId: string, input: CreateContactInput) {
  return prisma.crmContact.create({
    data: {
      organizationId: orgId,
      name:           input.name,
      email:          input.email          ?? null,
      phone:          input.phone          ?? null,
      company:        input.company        ?? null,
      position:       input.position       ?? null,
      contactType:    input.contactType    ?? "LEAD",
      notes:          input.notes          ?? null,
      createdById:    input.createdById    ?? null,
    },
  });
}

export async function updateContact(
  orgId: string,
  id: string,
  input: UpdateContactInput
) {
  const existing = await prisma.crmContact.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!existing) throw new Error("Contact not found");

  return prisma.crmContact.update({
    where: { id },
    data: {
      ...(input.name        !== undefined && { name:        input.name }),
      ...(input.email       !== undefined && { email:       input.email }),
      ...(input.phone       !== undefined && { phone:       input.phone }),
      ...(input.company     !== undefined && { company:     input.company }),
      ...(input.position    !== undefined && { position:    input.position }),
      ...(input.contactType !== undefined && { contactType: input.contactType }),
      ...(input.notes       !== undefined && { notes:       input.notes }),
    },
  });
}

export async function deleteContact(orgId: string, id: string) {
  const existing = await prisma.crmContact.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!existing) throw new Error("Contact not found");

  return prisma.crmContact.delete({ where: { id } });
}

/* ================================================================== */
/*  Deals                                                               */
/* ================================================================== */

export async function listDeals(
  orgId: string,
  filters: {
    stage?: CrmDealStage;
    contactId?: string;
    page?: number;
    limit?: number;
  }
) {
  const page  = filters.page  ?? 1;
  const limit = filters.limit ?? 20;

  const where: Prisma.CrmDealWhereInput = {
    organizationId: orgId,
    ...(filters.stage     && { stage:     filters.stage }),
    ...(filters.contactId && { contactId: filters.contactId }),
  };

  const [data, total] = await Promise.all([
    prisma.crmDeal.findMany({
      where,
      include: {
        contact: { select: { id: true, name: true, company: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.crmDeal.count({ where }),
  ]);

  return { data, total, page, limit };
}

export async function getDealById(orgId: string, id: string) {
  return prisma.crmDeal.findFirst({
    where: { id, organizationId: orgId },
    include: {
      contact:    true,
      activities: { orderBy: { createdAt: "desc" } },
      tasks:      { orderBy: { dueDate: "asc" } },
      invoice:    { select: { id: true, invoiceNumber: true, status: true, totalAmount: true } },
    },
  });
}

export async function createDeal(orgId: string, input: CreateDealInput) {
  return prisma.crmDeal.create({
    data: {
      organizationId:    orgId,
      title:             input.title,
      value:             new Prisma.Decimal(input.value ?? 0),
      currency:          input.currency          ?? "PHP",
      stage:             input.stage             ?? "NEW_LEAD",
      probability:       input.probability       ?? 0,
      expectedCloseDate: input.expectedCloseDate ?? null,
      contactId:         input.contactId         ?? null,
      notes:             input.notes             ?? null,
      createdById:       input.createdById       ?? null,
    },
  });
}

export async function updateDeal(
  orgId: string,
  id: string,
  input: UpdateDealInput
) {
  const existing = await prisma.crmDeal.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!existing) throw new Error("Deal not found");

  return prisma.crmDeal.update({
    where: { id },
    data: {
      ...(input.title             !== undefined && { title:             input.title }),
      ...(input.value             !== undefined && { value:             new Prisma.Decimal(input.value) }),
      ...(input.currency          !== undefined && { currency:          input.currency }),
      ...(input.stage             !== undefined && { stage:             input.stage }),
      ...(input.probability       !== undefined && { probability:       input.probability }),
      ...(input.expectedCloseDate !== undefined && { expectedCloseDate: input.expectedCloseDate }),
      ...(input.contactId         !== undefined && { contactId:         input.contactId }),
      ...(input.notes             !== undefined && { notes:             input.notes }),
    },
  });
}

export async function deleteDeal(orgId: string, id: string) {
  const existing = await prisma.crmDeal.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!existing) throw new Error("Deal not found");

  return prisma.crmDeal.delete({ where: { id } });
}

export async function moveDealStage(
  orgId: string,
  id: string,
  stage: CrmDealStage
) {
  const existing = await prisma.crmDeal.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!existing) throw new Error("Deal not found");

  const isClosed = stage === "WON" || stage === "LOST";

  return prisma.crmDeal.update({
    where: { id },
    data: {
      stage,
      closedAt: isClosed ? new Date() : null,
    },
  });
}

export async function convertDealToInvoice(
  orgId: string,
  id: string,
  createdById?: string
) {
  return prisma.$transaction(async (tx) => {
    const deal = await tx.crmDeal.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!deal) throw new Error("Deal not found");
    if (deal.stage !== "WON") throw new Error("Only WON deals can be converted to invoices");
    if (deal.invoiceId) throw new Error("Deal already has an associated invoice");

    const count = await tx.accInvoice.count({ where: { organizationId: orgId } });
    const year  = new Date().getFullYear();
    const invoiceNumber = `INV-${year}-${String(count + 1).padStart(5, "0")}`;

    const dealValue    = Number(deal.value);
    const now          = new Date();
    const dueDate      = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const invoice = await tx.accInvoice.create({
      data: {
        organizationId:  orgId,
        invoiceNumber,
        customerName:    deal.title,
        issueDate:       now,
        dueDate,
        currency:        deal.currency,
        subtotalAmount:  new Prisma.Decimal(dealValue),
        taxAmount:       new Prisma.Decimal(0),
        totalAmount:     new Prisma.Decimal(dealValue),
        status:          "DRAFT",
        notes:           deal.notes ?? null,
        createdById:     createdById ?? null,
        lines: {
          create: [
            {
              description: deal.title,
              quantity:    new Prisma.Decimal(1),
              unitPrice:   new Prisma.Decimal(dealValue),
              amount:      new Prisma.Decimal(dealValue),
              taxRate:     new Prisma.Decimal(0),
            },
          ],
        },
      },
      include: { lines: true },
    });

    const updatedDeal = await tx.crmDeal.update({
      where: { id },
      data: { invoiceId: invoice.id },
    });

    return { deal: updatedDeal, invoice };
  });
}

/* ================================================================== */
/*  Activities                                                          */
/* ================================================================== */

export async function listActivities(
  orgId: string,
  filters: {
    dealId?: string;
    contactId?: string;
    activityType?: CrmActivityType;
    page?: number;
    limit?: number;
  }
) {
  const page  = filters.page  ?? 1;
  const limit = filters.limit ?? 20;

  const where: Prisma.CrmActivityWhereInput = {
    organizationId: orgId,
    ...(filters.dealId       && { dealId:       filters.dealId }),
    ...(filters.contactId    && { contactId:    filters.contactId }),
    ...(filters.activityType && { activityType: filters.activityType }),
  };

  const [data, total] = await Promise.all([
    prisma.crmActivity.findMany({
      where,
      include: {
        deal:    { select: { id: true, title: true } },
        contact: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.crmActivity.count({ where }),
  ]);

  return { data, total, page, limit };
}

export async function createActivity(orgId: string, input: CreateActivityInput) {
  return prisma.crmActivity.create({
    data: {
      organizationId: orgId,
      activityType:   input.activityType,
      subject:        input.subject,
      body:           input.body        ?? null,
      dealId:         input.dealId      ?? null,
      contactId:      input.contactId   ?? null,
      createdById:    input.createdById ?? null,
    },
  });
}

export async function deleteActivity(orgId: string, id: string) {
  const existing = await prisma.crmActivity.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!existing) throw new Error("Activity not found");

  return prisma.crmActivity.delete({ where: { id } });
}

/* ================================================================== */
/*  Tasks                                                               */
/* ================================================================== */

export async function listTasks(
  orgId: string,
  filters: {
    dealId?: string;
    isDone?: boolean;
    page?: number;
    limit?: number;
  }
) {
  const page  = filters.page  ?? 1;
  const limit = filters.limit ?? 20;

  const where: Prisma.CrmTaskWhereInput = {
    organizationId: orgId,
    ...(filters.dealId !== undefined && { dealId: filters.dealId }),
    ...(filters.isDone !== undefined && { isDone: filters.isDone }),
  };

  const [data, total] = await Promise.all([
    prisma.crmTask.findMany({
      where,
      include: {
        deal: { select: { id: true, title: true } },
      },
      orderBy: [{ isDone: "asc" }, { dueDate: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.crmTask.count({ where }),
  ]);

  return { data, total, page, limit };
}

export async function createTask(orgId: string, input: CreateTaskInput) {
  return prisma.crmTask.create({
    data: {
      organizationId: orgId,
      title:          input.title,
      description:    input.description  ?? null,
      dueDate:        input.dueDate      ?? null,
      dealId:         input.dealId       ?? null,
      assignedToId:   input.assignedToId ?? null,
      createdById:    input.createdById  ?? null,
    },
  });
}

export async function updateTask(
  orgId: string,
  id: string,
  input: UpdateTaskInput
) {
  const existing = await prisma.crmTask.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!existing) throw new Error("Task not found");

  return prisma.crmTask.update({
    where: { id },
    data: {
      ...(input.title        !== undefined && { title:        input.title }),
      ...(input.description  !== undefined && { description:  input.description }),
      ...(input.dueDate      !== undefined && { dueDate:      input.dueDate }),
      ...(input.isDone       !== undefined && { isDone:       input.isDone }),
      ...(input.assignedToId !== undefined && { assignedToId: input.assignedToId }),
    },
  });
}

export async function deleteTask(orgId: string, id: string) {
  const existing = await prisma.crmTask.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!existing) throw new Error("Task not found");

  return prisma.crmTask.delete({ where: { id } });
}

export async function toggleTask(orgId: string, id: string) {
  const existing = await prisma.crmTask.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!existing) throw new Error("Task not found");

  return prisma.crmTask.update({
    where: { id },
    data: { isDone: !existing.isDone },
  });
}

/* ================================================================== */
/*  Dashboard                                                           */
/* ================================================================== */

export async function getCrmDashboard(orgId: string) {
  const now         = new Date();
  const monthStart  = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd    = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [
    totalContacts,
    totalDeals,
    pipelineAgg,
    wonAgg,
    dealsByStageRaw,
    recentActivities,
    overdueTasks,
  ] = await Promise.all([
    prisma.crmContact.count({ where: { organizationId: orgId } }),

    prisma.crmDeal.count({ where: { organizationId: orgId } }),

    prisma.crmDeal.aggregate({
      where: {
        organizationId: orgId,
        stage: { notIn: ["WON", "LOST"] },
      },
      _sum: { value: true },
    }),

    prisma.crmDeal.aggregate({
      where: {
        organizationId: orgId,
        stage:    "WON",
        closedAt: { gte: monthStart, lte: monthEnd },
      },
      _sum: { value: true },
    }),

    prisma.crmDeal.groupBy({
      by: ["stage"],
      where: { organizationId: orgId },
      _count: { _all: true },
      _sum:   { value: true },
    }),

    prisma.crmActivity.findMany({
      where: { organizationId: orgId },
      include: {
        deal:    { select: { id: true, title: true } },
        contact: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),

    prisma.crmTask.findMany({
      where: {
        organizationId: orgId,
        isDone:  false,
        dueDate: { lt: now },
      },
      include: {
        deal: { select: { id: true, title: true } },
      },
      orderBy: { dueDate: "asc" },
    }),
  ]);

  const dealsByStage = dealsByStageRaw.map((row) => ({
    stage: row.stage as string,
    count: row._count._all,
    value: Number(row._sum.value ?? 0),
  }));

  return {
    totalContacts,
    totalDeals,
    totalPipelineValue: Number(pipelineAgg._sum.value ?? 0),
    totalWonValue:      Number(wonAgg._sum.value      ?? 0),
    dealsByStage,
    recentActivities,
    overdueTasks,
  };
}

/* ================================================================== */
/*  Pipeline (Kanban)                                                   */
/* ================================================================== */

export async function getPipelineDeals(orgId: string) {
  const deals = await prisma.crmDeal.findMany({
    where: {
      organizationId: orgId,
      stage: { not: "LOST" },
    },
    include: {
      contact: { select: { id: true, name: true, company: true } },
    },
    orderBy: [{ stage: "asc" }, { createdAt: "desc" }],
  });

  const grouped: Record<string, typeof deals> = {
    NEW_LEAD:    [],
    QUALIFIED:   [],
    PROPOSAL:    [],
    NEGOTIATION: [],
    WON:         [],
  };

  for (const deal of deals) {
    const key = deal.stage as string;
    if (grouped[key]) {
      grouped[key].push(deal);
    }
  }

  return grouped as Record<CrmDealStage, typeof deals>;
}
