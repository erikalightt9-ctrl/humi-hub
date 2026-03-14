import type { ActorType, NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  Create                                                             */
/* ------------------------------------------------------------------ */

export async function createNotification(data: {
  readonly recipientType: ActorType;
  readonly recipientId: string;
  readonly type: NotificationType;
  readonly title: string;
  readonly message: string;
  readonly linkUrl?: string;
}) {
  return prisma.notification.create({
    data: {
      recipientType: data.recipientType,
      recipientId: data.recipientId,
      type: data.type,
      title: data.title,
      message: data.message,
      linkUrl: data.linkUrl ?? null,
    },
  });
}

/* ------------------------------------------------------------------ */
/*  Query                                                              */
/* ------------------------------------------------------------------ */

export async function findByRecipient(
  recipientType: ActorType,
  recipientId: string,
  filters: {
    readonly type?: NotificationType;
    readonly isRead?: boolean;
    readonly page?: number;
    readonly limit?: number;
  } = {}
) {
  const { type, isRead, page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { recipientType, recipientId };
  if (type) where.type = type;
  if (isRead !== undefined) where.isRead = isRead;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    data: notifications,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getUnreadCount(
  recipientType: ActorType,
  recipientId: string
) {
  return prisma.notification.count({
    where: { recipientType, recipientId, isRead: false },
  });
}

/* ------------------------------------------------------------------ */
/*  Mark Read                                                          */
/* ------------------------------------------------------------------ */

export async function markAsRead(id: string) {
  return prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });
}

export async function markAllAsRead(
  recipientType: ActorType,
  recipientId: string
) {
  return prisma.notification.updateMany({
    where: { recipientType, recipientId, isRead: false },
    data: { isRead: true },
  });
}
