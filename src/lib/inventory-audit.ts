import { createId } from "@paralleldrive/cuid2";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function logInventoryAudit(opts: {
  organizationId: string;
  actorId?: string | null;
  action: string;
  targetType: "category" | "item" | "movement";
  targetId?: string | null;
  payload?: Prisma.InputJsonValue;
}) {
  try {
    await prisma.inventoryAuditLog.create({
      data: {
        id: createId(),
        organizationId: opts.organizationId,
        actorId: opts.actorId ?? null,
        action: opts.action,
        targetType: opts.targetType,
        targetId: opts.targetId ?? null,
        payload: opts.payload,
      },
    });
  } catch (err) {
    console.error("inventory audit log failed", err);
  }
}
