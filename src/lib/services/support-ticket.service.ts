import type { ActorType, TicketCategory, TicketPriority } from "@prisma/client";
import * as ticketRepo from "@/lib/repositories/support-ticket.repository";
import { notify, notifyMany } from "@/lib/services/in-app-notification.service";
import { resolveActor } from "@/lib/services/actor.service";
import { prisma } from "@/lib/prisma";
import { isOpenAIAvailable, getOpenAI } from "@/lib/openai";
import type { TicketAttachment } from "@/lib/validations/support-ticket.schema";
import {
  sendNewTicketAdminNotification,
  sendTicketReplyEmail,
} from "@/lib/email/send-ticket-notifications";

/* ------------------------------------------------------------------ */
/*  Create Ticket                                                      */
/* ------------------------------------------------------------------ */

export async function createTicket(data: {
  readonly category: TicketCategory;
  readonly priority?: TicketPriority;
  readonly subject: string;
  readonly description: string;
  readonly submitterType: ActorType;
  readonly submitterId: string;
}) {
  const ticket = await ticketRepo.createTicket(data);

  // Fire-and-forget: notify all admins (in-app + email)
  notifyAdminsOfNewTicket(ticket).catch((err) =>
    console.error("[createTicket] notify admins error", err)
  );

  // Fire-and-forget: AI auto-reply when OpenAI is configured
  if (isOpenAIAvailable()) {
    generateAiAutoReply(ticket).catch((err) =>
      console.error("[createTicket] AI auto-reply error", err)
    );
  }

  return ticket;
}

/* ------------------------------------------------------------------ */
/*  Admin Notification on New Ticket                                   */
/* ------------------------------------------------------------------ */

async function notifyAdminsOfNewTicket(ticket: {
  readonly id: string;
  readonly referenceNo: string;
  readonly subject: string;
  readonly priority: TicketPriority;
  readonly category: TicketCategory;
  readonly submitterType: ActorType;
  readonly submitterId: string;
}) {
  const admins = await prisma.admin.findMany({ select: { id: true, name: true, email: true } });
  if (admins.length === 0) return;

  // Resolve submitter name for email
  const submitter = await resolveActor(ticket.submitterType, ticket.submitterId);
  const submitterName = submitter?.name ?? "Unknown";

  // In-app notifications (batch)
  const recipients = admins.map((a) => ({ actorType: "ADMIN" as const, actorId: a.id }));
  await notifyMany(recipients, {
    type: "TICKET_RESPONSE",
    title: `New [${ticket.priority}] Support Ticket`,
    message: `${ticket.referenceNo}: "${ticket.subject}"`,
    linkUrl: `/admin/tickets?id=${ticket.id}`,
  });

  // Email notifications (fire-and-forget per admin)
  await sendNewTicketAdminNotification({
    referenceNo: ticket.referenceNo,
    subject: ticket.subject,
    priority: ticket.priority,
    category: ticket.category,
    submitterName,
    submitterType: ticket.submitterType,
    ticketId: ticket.id,
    admins,
  });
}

/* ------------------------------------------------------------------ */
/*  AI Auto-reply                                                      */
/* ------------------------------------------------------------------ */

async function generateAiAutoReply(ticket: {
  readonly id: string;
  readonly category: TicketCategory;
  readonly subject: string;
  readonly description: string;
}) {
  try {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful support agent for a VA training center platform. " +
            "Write a brief, empathetic acknowledgement and initial guidance for the support ticket. " +
            "Keep it under 150 words. Be specific to the category and issue described.",
        },
        {
          role: "user",
          content: `Category: ${ticket.category}\nSubject: ${ticket.subject}\nDescription: ${ticket.description}`,
        },
      ],
      max_tokens: 250,
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return;

    const adminId = await getFirstAdminId();
    await ticketRepo.createResponse(ticket.id, {
      authorType: "ADMIN",
      authorId: adminId,
      content: `🤖 **Automated Response**\n\n${content}`,
      isInternal: false,
    });
  } catch (err) {
    console.error("[generateAiAutoReply] error", err);
  }
}

async function getFirstAdminId(): Promise<string> {
  const admin = await prisma.admin.findFirst({ select: { id: true } });
  if (!admin) throw new Error("No admin found for AI auto-reply");
  return admin.id;
}

/* ------------------------------------------------------------------ */
/*  Add Response + Notify                                              */
/* ------------------------------------------------------------------ */

export async function addResponse(
  ticketId: string,
  data: {
    readonly authorType: ActorType;
    readonly authorId: string;
    readonly content: string;
    readonly isInternal?: boolean;
    readonly attachments?: readonly TicketAttachment[];
  }
) {
  const response = await ticketRepo.createResponse(ticketId, data);

  // Notify ticket submitter when admin responds (skip internal notes, skip self-replies)
  if (!data.isInternal) {
    const ticket = await ticketRepo.findTicketById(ticketId);
    if (ticket && !(ticket.submitterType === data.authorType && ticket.submitterId === data.authorId)) {
      const author = await resolveActor(data.authorType, data.authorId);
      const authorName = author?.name ?? "Support";

      const linkBase =
        ticket.submitterType === "STUDENT"
          ? "student"
          : ticket.submitterType === "TRAINER"
          ? "trainer"
          : "corporate";

      // In-app notification
      await notify({
        recipientType: ticket.submitterType,
        recipientId: ticket.submitterId,
        type: "TICKET_RESPONSE",
        title: `Response on ${ticket.referenceNo}`,
        message: `${authorName} responded to your ticket: "${ticket.subject}"`,
        linkUrl: `/${linkBase}/support?ticket=${ticket.id}`,
      });

      // Email notification (fire-and-forget)
      const submitter = await resolveActor(ticket.submitterType, ticket.submitterId);
      if (submitter?.email) {
        sendTicketReplyEmail({
          referenceNo: ticket.referenceNo,
          subject: ticket.subject,
          recipientName: submitter.name,
          recipientEmail: submitter.email,
          responderName: authorName,
          replyContent: data.content,
          ticketId: ticket.id,
          submitterType: ticket.submitterType,
        }).catch((err) => console.error("[addResponse] email notification error", err));
      }
    }
  }

  return response;
}
