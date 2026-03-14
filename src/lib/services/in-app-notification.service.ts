import type { ActorType, NotificationType } from "@prisma/client";
import { createNotification } from "@/lib/repositories/notification.repository";

interface NotifyParams {
  readonly recipientType: ActorType;
  readonly recipientId: string;
  readonly type: NotificationType;
  readonly title: string;
  readonly message: string;
  readonly linkUrl?: string;
}

/**
 * Creates an in-app notification record.
 * Email notification can be added here in the future.
 */
export async function notify(params: NotifyParams) {
  return createNotification({
    recipientType: params.recipientType,
    recipientId: params.recipientId,
    type: params.type,
    title: params.title,
    message: params.message,
    linkUrl: params.linkUrl,
  });
}

/**
 * Notify multiple recipients at once.
 */
export async function notifyMany(
  recipients: ReadonlyArray<{
    readonly actorType: ActorType;
    readonly actorId: string;
  }>,
  data: {
    readonly type: NotificationType;
    readonly title: string;
    readonly message: string;
    readonly linkUrl?: string;
  }
) {
  const promises = recipients.map((r) =>
    notify({
      recipientType: r.actorType,
      recipientId: r.actorId,
      ...data,
    })
  );
  return Promise.allSettled(promises);
}
