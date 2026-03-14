import type { ActorType, TicketStatus, TicketPriority, TicketCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { TICKET_REFERENCE_PREFIX } from "@/lib/constants/communications";

/* ------------------------------------------------------------------ */
/*  Interfaces                                                         */
/* ------------------------------------------------------------------ */

interface CreateTicketData {
  readonly category: TicketCategory;
  readonly priority?: TicketPriority;
  readonly subject: string;
  readonly description: string;
  readonly submitterType: ActorType;
  readonly submitterId: string;
}

interface TicketFilters {
  readonly status?: TicketStatus;
  readonly category?: TicketCategory;
  readonly priority?: TicketPriority;
  readonly submitterType?: ActorType;
  readonly submitterId?: string;
  readonly search?: string;
  readonly page?: number;
  readonly limit?: number;
}

/* ------------------------------------------------------------------ */
/*  Reference Number                                                   */
/* ------------------------------------------------------------------ */

function generateReferenceNumber(): string {
  const datePart = new Date()
    .toISOString()
    .slice(2, 10)
    .replace(/-/g, "");
  const randomPart = crypto.randomUUID().slice(0, 6).toUpperCase();
  return `${TICKET_REFERENCE_PREFIX}-${datePart}-${randomPart}`;
}

/* ------------------------------------------------------------------ */
/*  CRUD                                                               */
/* ------------------------------------------------------------------ */

export async function createTicket(data: CreateTicketData) {
  return prisma.supportTicket.create({
    data: {
      referenceNo: generateReferenceNumber(),
      category: data.category,
      priority: data.priority ?? "MEDIUM",
      subject: data.subject,
      description: data.description,
      submitterType: data.submitterType,
      submitterId: data.submitterId,
    },
  });
}

export async function findTicketById(id: string) {
  return prisma.supportTicket.findUnique({
    where: { id },
    include: {
      responses: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function findTickets(filters: TicketFilters = {}) {
  const { status, category, priority, submitterType, submitterId, search, page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (category) where.category = category;
  if (priority) where.priority = priority;
  if (submitterType && submitterId) {
    where.submitterType = submitterType;
    where.submitterId = submitterId;
  }
  if (search) {
    where.OR = [
      { subject: { contains: search, mode: "insensitive" } },
      { referenceNo: { contains: search, mode: "insensitive" } },
    ];
  }

  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      include: { _count: { select: { responses: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.supportTicket.count({ where }),
  ]);

  return {
    data: tickets,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function updateTicketStatus(
  id: string,
  data: {
    readonly status?: TicketStatus;
    readonly priority?: TicketPriority;
    readonly assignedToId?: string | null;
  }
) {
  const updateData: Record<string, unknown> = {};
  if (data.status !== undefined) {
    updateData.status = data.status;
    if (data.status === "RESOLVED") updateData.resolvedAt = new Date();
    if (data.status === "CLOSED") updateData.closedAt = new Date();
  }
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.assignedToId !== undefined) updateData.assignedToId = data.assignedToId;

  return prisma.supportTicket.update({
    where: { id },
    data: updateData,
  });
}

export async function createResponse(
  ticketId: string,
  data: {
    readonly authorType: ActorType;
    readonly authorId: string;
    readonly content: string;
    readonly isInternal?: boolean;
  }
) {
  return prisma.ticketResponse.create({
    data: {
      ticketId,
      authorType: data.authorType,
      authorId: data.authorId,
      content: data.content,
      isInternal: data.isInternal ?? false,
    },
  });
}
