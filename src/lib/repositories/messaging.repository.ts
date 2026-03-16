import type { ActorType, ConversationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  Name resolution helpers                                            */
/* ------------------------------------------------------------------ */

type ParticipantRef = { readonly actorType: ActorType; readonly actorId: string };

async function resolveParticipantNames(
  participants: ReadonlyArray<ParticipantRef>
): Promise<Map<string, string>> {
  const adminIds: string[] = [];
  const trainerIds: string[] = [];
  const studentIds: string[] = [];
  const corporateIds: string[] = [];

  for (const p of participants) {
    if (p.actorType === "ADMIN") adminIds.push(p.actorId);
    else if (p.actorType === "TRAINER") trainerIds.push(p.actorId);
    else if (p.actorType === "STUDENT") studentIds.push(p.actorId);
    else if (p.actorType === "CORPORATE_MANAGER") corporateIds.push(p.actorId);
  }

  const [admins, trainers, students, corporates] = await Promise.all([
    adminIds.length > 0
      ? prisma.admin.findMany({ where: { id: { in: adminIds } }, select: { id: true, name: true } })
      : [],
    trainerIds.length > 0
      ? prisma.trainer.findMany({ where: { id: { in: trainerIds } }, select: { id: true, name: true } })
      : [],
    studentIds.length > 0
      ? prisma.student.findMany({ where: { id: { in: studentIds } }, select: { id: true, name: true } })
      : [],
    corporateIds.length > 0
      ? prisma.corporateManager.findMany({ where: { id: { in: corporateIds } }, select: { id: true, name: true } })
      : [],
  ]);

  const nameMap = new Map<string, string>();
  for (const a of admins) nameMap.set(`ADMIN:${a.id}`, a.name);
  for (const t of trainers) nameMap.set(`TRAINER:${t.id}`, t.name);
  for (const s of students) nameMap.set(`STUDENT:${s.id}`, s.name);
  for (const c of corporates) nameMap.set(`CORPORATE_MANAGER:${c.id}`, c.name);
  return nameMap;
}

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

  // Collect all unique participants across conversations for batch name resolution
  const allParticipants = conversations.flatMap((c) => c.participants);
  const nameMap = await resolveParticipantNames(allParticipants);

  const enriched = conversations.map((conv) => ({
    ...conv,
    participants: conv.participants.map((p) => ({
      ...p,
      displayName: nameMap.get(`${p.actorType}:${p.actorId}`) ?? null,
    })),
  }));

  return {
    data: enriched,
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
      include: {
        reads: { select: { actorType: true, actorId: true } },
      },
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

export async function markMessagesRead(
  conversationId: string,
  actorType: ActorType,
  actorId: string
) {
  // Fetch all messages in this conversation not yet read by this actor
  const unread = await prisma.directMessage.findMany({
    where: {
      conversationId,
      senderType: { not: actorType },
      senderId: { not: actorId },
      reads: { none: { actorType, actorId } },
    },
    select: { id: true },
  });

  if (unread.length === 0) return;

  await prisma.messageRead.createMany({
    data: unread.map((m) => ({ messageId: m.id, actorType, actorId })),
    skipDuplicates: true,
  });
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
