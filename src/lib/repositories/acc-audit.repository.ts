import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export interface AuditLogInput {
  organizationId: string;
  entityType: string;
  entityId: string;
  action: string;
  changes?: Record<string, unknown>;
  performedById?: string;
  performedByName?: string;
  performedByRole?: string;
  ipAddress?: string;
}

/* ------------------------------------------------------------------ */
/*  Mutations                                                           */
/* ------------------------------------------------------------------ */

/** Fire-and-forget — never throws so it never blocks the main flow */
export function logAction(data: AuditLogInput): void {
  prisma.accAuditLog
    .create({
      data: {
        organizationId:  data.organizationId,
        entityType:      data.entityType,
        entityId:        data.entityId,
        action:          data.action,
        changes:         data.changes ? (data.changes as object) : undefined,
        performedById:   data.performedById   ?? null,
        performedByName: data.performedByName ?? null,
        performedByRole: data.performedByRole ?? null,
        ipAddress:       data.ipAddress       ?? null,
      },
    })
    .catch((err) => {
      console.error("[acc-audit] failed to log action:", err);
    });
}

/* ------------------------------------------------------------------ */
/*  Queries                                                             */
/* ------------------------------------------------------------------ */

export async function getAuditLogs(
  organizationId: string,
  filters: {
    entityType?: string;
    entityId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
  }
) {
  const page  = filters.page  ?? 1;
  const limit = filters.limit ?? 30;
  const where = {
    organizationId,
    ...(filters.entityType && { entityType: filters.entityType }),
    ...(filters.entityId   && { entityId:   filters.entityId   }),
    ...(filters.dateFrom   && { createdAt:  { gte: filters.dateFrom } }),
    ...(filters.dateTo     && { createdAt:  { lte: filters.dateTo   } }),
  };

  const [data, total] = await Promise.all([
    prisma.accAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.accAuditLog.count({ where }),
  ]);
  return { data, total, page, limit };
}

export async function getAuditTrailForEntity(
  organizationId: string,
  entityType: string,
  entityId: string
) {
  return prisma.accAuditLog.findMany({
    where: { organizationId, entityType, entityId },
    orderBy: { createdAt: "desc" },
  });
}
