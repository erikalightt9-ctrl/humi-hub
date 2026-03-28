import type { ActorType, ConversationType } from "@prisma/client";
import * as messagingRepo from "@/lib/repositories/messaging.repository";
import { notify } from "@/lib/services/in-app-notification.service";
import { resolveActor } from "@/lib/services/actor.service";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Returns the role-prefixed messages path for a given actor type. */
function messagesPath(actorType: ActorType, conversationId: string): string {
  const base: Partial<Record<ActorType, string>> = {
    STUDENT: "student",
    TRAINER: "trainer",
    ADMIN: "admin",
    CORPORATE_MANAGER: "corporate",
  };
  const prefix = base[actorType] ?? "student";
  return `/${prefix}/messages?conversation=${conversationId}`;
}

/* ------------------------------------------------------------------ */
/*  Create or Find Conversation                                        */
/* ------------------------------------------------------------------ */

export async function getOrCreateDirectConversation(
  actor1: { readonly actorType: ActorType; readonly actorId: string },
  actor2: { readonly actorType: ActorType; readonly actorId: string },
  tenantId: string | null = null
) {
  return messagingRepo.findOrCreateDirectConversation(actor1, actor2, tenantId);
}

export async function createGroupConversation(data: {
  readonly type: ConversationType;
  readonly title?: string;
  readonly tenantId?: string | null;
  readonly courseId?: string;
  readonly lessonId?: string;
  readonly createdByType: ActorType;
  readonly createdById: string;
  readonly participantIds: ReadonlyArray<{
    readonly actorType: ActorType;
    readonly actorId: string;
  }>;
}) {
  return messagingRepo.createConversation({
    type: data.type,
    title: data.title,
    tenantId: data.tenantId,
    courseId: data.courseId,
    lessonId: data.lessonId,
    createdByType: data.createdByType,
    createdById: data.createdById,
    participantIds: data.participantIds,
  });
}

/* ------------------------------------------------------------------ */
/*  Send Message + Notify                                              */
/* ------------------------------------------------------------------ */

export async function sendMessage(
  conversationId: string,
  senderType: ActorType,
  senderId: string,
  content: string,
  attachmentUrl?: string | null,
  attachmentName?: string | null
) {
  const message = await messagingRepo.sendMessage(conversationId, {
    senderType,
    senderId,
    content,
    attachmentUrl,
    attachmentName,
  });

  const conversation = await messagingRepo.getConversationById(conversationId);
  if (conversation) {
    const sender = await resolveActor(senderType, senderId);
    const senderName = sender?.name ?? "Someone";

    const otherParticipants = conversation.participants.filter(
      (p) => !(p.actorType === senderType && p.actorId === senderId)
    );

    // Auto-upsert contacts (both directions)
    await Promise.allSettled([
      ...otherParticipants.map(async (p) => {
        const contactActor = await resolveActor(p.actorType, p.actorId);
        return messagingRepo.upsertContact(
          { actorType: senderType, actorId: senderId },
          { actorType: p.actorType, actorId: p.actorId, name: contactActor?.name ?? undefined },
          conversation.tenantId
        );
      }),
      ...otherParticipants.map((p) =>
        messagingRepo.upsertContact(
          { actorType: p.actorType, actorId: p.actorId },
          { actorType: senderType, actorId: senderId, name: senderName },
          conversation.tenantId
        )
      ),
    ]);

    // Notify other participants
    if (otherParticipants.length > 0) {
      await Promise.allSettled(
        otherParticipants.map((p) =>
          notify({
            recipientType: p.actorType,
            recipientId: p.actorId,
            type: "NEW_MESSAGE",
            title: "New Message",
            message: `${senderName}: ${content.slice(0, 100)}${content.length > 100 ? "..." : ""}`,
            linkUrl: messagesPath(p.actorType, conversationId),
            tenantId: conversation.tenantId,
          })
        )
      );
    }
  }

  return message;
}
