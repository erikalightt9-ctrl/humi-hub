import type { ActorType, TicketCategory, TicketPriority } from "@prisma/client";
import * as ticketRepo from "@/lib/repositories/support-ticket.repository";
import { notify } from "@/lib/services/in-app-notification.service";
import { resolveActor } from "@/lib/services/actor.service";

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
  return ticketRepo.createTicket(data);
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
  }
) {
  const response = await ticketRepo.createResponse(ticketId, data);

  // Notify ticket submitter when admin responds (skip internal notes)
  if (!data.isInternal) {
    const ticket = await ticketRepo.findTicketById(ticketId);
    if (ticket && !(ticket.submitterType === data.authorType && ticket.submitterId === data.authorId)) {
      const author = await resolveActor(data.authorType, data.authorId);
      const authorName = author?.name ?? "Support";

      await notify({
        recipientType: ticket.submitterType,
        recipientId: ticket.submitterId,
        type: "TICKET_RESPONSE",
        title: `Response on ${ticket.referenceNo}`,
        message: `${authorName} responded to your ticket: "${ticket.subject}"`,
        linkUrl: `/${ticket.submitterType === "STUDENT" ? "student" : ticket.submitterType === "TRAINER" ? "trainer" : "corporate"}/support?ticket=${ticket.id}`,
      });
    }
  }

  return response;
}
