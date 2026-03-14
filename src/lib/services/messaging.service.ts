import type { ActorType, ConversationType } from "@prisma/client";
import * as messagingRepo from "@/lib/repositories/messaging.repository";
import { notifyMany } from "@/lib/services/in-app-notification.service";
import { resolveActor } from "@/lib/services/actor.service";

/* ------------------------------------------------------------------ */
/*  Create or Find Conversation                                        */
/* ------------------------------------------------------------------ */

export async function getOrCreateDirectConversation(
  actor1: { readonly actorType: ActorType; readonly actorId: string },
  actor2: { readonly actorType: ActorType; readonly actorId: string }
) {
  return messagingRepo.findOrCreateDirectConversation(actor1, actor2);
}

export async function createGroupConversation(data: {
  readonly type: ConversationType;
  readonly title?: string;
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

  // Notify other participants
  const conversation = await messagingRepo.getConversationById(conversationId);
  if (conversation) {
    const sender = await resolveActor(senderType, senderId);
    const senderName = sender?.name ?? "Someone";

    const otherParticipants = conversation.participants.filter(
      (p) => !(p.actorType === senderType && p.actorId === senderId)
    );

    if (otherParticipants.length > 0) {
      await notifyMany(
        otherParticipants.map((p) => ({
          actorType: p.actorType,
          actorId: p.actorId,
        })),
        {
          type: "NEW_MESSAGE",
          title: "New Message",
          message: `${senderName}: ${content.slice(0, 100)}${content.length > 100 ? "..." : ""}`,
          linkUrl: `/messages?conversation=${conversationId}`,
        }
      );
    }
  }

  return message;
}
