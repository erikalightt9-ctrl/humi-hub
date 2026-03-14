import type { ActorType, ConversationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  Interfaces                                                         */
/* ------------------------------------------------------------------ */

interface CreateConversationData {
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
}

/* ------------------------------------------------------------------ */
/*  Conversation CRUD                                                  */
/* ------------------------------------------------------------------ */

export async function createConversation(data: CreateConversationData) {
  const allParticipants = [
    { actorType: data.createdByType, actorId: data.createdById },
    ...data.participantIds.filter(
      (p) =>
        !(p.actorType === data.createdByType && p.actorId === data.createdById)
    ),
  ];

  return prisma.conversation.create({
    data: {
      type: data.type,
      title: data.title ?? null,
      courseId: data.courseId ?? null,
      lessonId: data.lessonId ?? null,
      createdByType: data.createdByType,
      createdById: data.createdById,
      participants: {
        create: allParticipants.map((p) => ({
          actorType: p.actorType,
          actorId: p.actorId,
        })),
      },
    },
    include: { participants: true },
  });
}

export async function findOrCreateDirectConversation(
  actor1: { readonly actorType: ActorType; readonly actorId: string },
  actor2: { readonly actorType: ActorType; readonly actorId: string }
) {
  const existing = await prisma.conversation.findFirst({
    where: {
      type: "DIRECT",
      isActive: true,
      AND: [
        {
          participants: {
            some: { actorType: actor1.actorType, actorId: actor1.actorId },
          },
        },
        {
          participants: {
            some: { actorType: actor2.actorType, actorId: actor2.actorId },
          },
        },
      ],
    },
    include: { participants: true },
  });

  if (existing) return existing;

  return createConversation({
    type: "DIRECT",
    createdByType: actor1.actorType,
    createdById: actor1.actorId,
    participantIds: [actor2],
  });
}

export async function getConversations(
  actorType: ActorType,
  actorId: string,
  page = 1,
  limit = 20
) {
  const skip = (page - 1) * limit;

  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      where: {
        isActive: true,
        participants: { some: { actorType, actorId } },
      },
      include: {
        participants: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            content: true,
            senderType: true,
            senderId: true,
            createdAt: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.conversation.count({
      where: {
        isActive: true,
        participants: { some: { actorType, actorId } },
      },
    }),
  ]);

  return {
    data: conversations,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getConversationById(conversationId: string) {
  return prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { participants: true },
  });
}

/* ------------------------------------------------------------------ */
/*  Messages                                                           */
/* ------------------------------------------------------------------ */

export async function sendMessage(
  conversationId: string,
  data: {
    readonly senderType: ActorType;
    readonly senderId: string;
    readonly content: string;
    readonly attachmentUrl?: string | null;
    readonly attachmentName?: string | null;
  }
) {
  const [message] = await Promise.all([
    prisma.directMessage.create({
      data: {
        conversationId,
        senderType: data.senderType,
        senderId: data.senderId,
        content: data.content,
        attachmentUrl: data.attachmentUrl ?? null,
        attachmentName: data.attachmentName ?? null,
      },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    }),
  ]);
  return message;
}

export async function getMessages(
  conversationId: string,
  page = 1,
  limit = 50
) {
  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    prisma.directMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      skip,
      take: limit,
    }),
    prisma.directMessage.count({ where: { conversationId } }),
  ]);

  return {
    data: messages,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function markConversationRead(
  conversationId: string,
  actorType: ActorType,
  actorId: string
) {
  return prisma.conversationParticipant.updateMany({
    where: { conversationId, actorType, actorId },
    data: { lastReadAt: new Date() },
  });
}
