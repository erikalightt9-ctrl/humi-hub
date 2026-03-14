import type {
  ActorType,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  ConversationType,
  NotificationType,
  KBCategory,
} from "@prisma/client";

/* ------------------------------------------------------------------ */
/*  Actor                                                              */
/* ------------------------------------------------------------------ */

export interface ActorInfo {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly type: ActorType;
}

/* ------------------------------------------------------------------ */
/*  Support Tickets                                                    */
/* ------------------------------------------------------------------ */

export interface TicketResponseItem {
  readonly id: string;
  readonly authorType: ActorType;
  readonly authorId: string;
  readonly authorName?: string;
  readonly content: string;
  readonly isInternal: boolean;
  readonly createdAt: Date | string;
}

export interface TicketWithResponses {
  readonly id: string;
  readonly referenceNo: string;
  readonly category: TicketCategory;
  readonly priority: TicketPriority;
  readonly status: TicketStatus;
  readonly subject: string;
  readonly description: string;
  readonly submitterType: ActorType;
  readonly submitterId: string;
  readonly submitterName?: string;
  readonly assignedToId: string | null;
  readonly assignedToName?: string;
  readonly resolvedAt: Date | string | null;
  readonly closedAt: Date | string | null;
  readonly createdAt: Date | string;
  readonly updatedAt: Date | string;
  readonly responses: readonly TicketResponseItem[];
}

export interface TicketListItem {
  readonly id: string;
  readonly referenceNo: string;
  readonly category: TicketCategory;
  readonly priority: TicketPriority;
  readonly status: TicketStatus;
  readonly subject: string;
  readonly submitterType: ActorType;
  readonly submitterId: string;
  readonly submitterName?: string;
  readonly createdAt: Date | string;
  readonly _count: { readonly responses: number };
}

export interface TicketFilters {
  readonly status?: TicketStatus;
  readonly category?: TicketCategory;
  readonly priority?: TicketPriority;
  readonly search?: string;
  readonly page?: number;
  readonly limit?: number;
}

/* ------------------------------------------------------------------ */
/*  Messaging                                                          */
/* ------------------------------------------------------------------ */

export interface ConversationListItem {
  readonly id: string;
  readonly type: ConversationType;
  readonly title: string | null;
  readonly courseId: string | null;
  readonly isActive: boolean;
  readonly createdAt: Date | string;
  readonly updatedAt: Date | string;
  readonly lastMessage: {
    readonly content: string;
    readonly senderName: string;
    readonly createdAt: Date | string;
  } | null;
  readonly unreadCount: number;
  readonly participants: readonly {
    readonly actorType: ActorType;
    readonly actorId: string;
    readonly actorName?: string;
  }[];
}

export interface MessageItem {
  readonly id: string;
  readonly senderType: ActorType;
  readonly senderId: string;
  readonly senderName?: string;
  readonly content: string;
  readonly attachmentUrl: string | null;
  readonly attachmentName: string | null;
  readonly createdAt: Date | string;
}

/* ------------------------------------------------------------------ */
/*  Notifications                                                      */
/* ------------------------------------------------------------------ */

export interface NotificationItem {
  readonly id: string;
  readonly type: NotificationType;
  readonly title: string;
  readonly message: string;
  readonly linkUrl: string | null;
  readonly isRead: boolean;
  readonly createdAt: Date | string;
}

/* ------------------------------------------------------------------ */
/*  Knowledge Base                                                     */
/* ------------------------------------------------------------------ */

export interface KBArticleListItem {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly category: KBCategory;
  readonly isPublished: boolean;
  readonly order: number;
  readonly createdAt: Date | string;
  readonly updatedAt: Date | string;
}

export interface KBArticleDetail {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly content: string;
  readonly category: KBCategory;
  readonly isPublished: boolean;
  readonly order: number;
  readonly createdBy: string;
  readonly createdAt: Date | string;
  readonly updatedAt: Date | string;
}
