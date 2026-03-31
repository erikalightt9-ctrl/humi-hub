/**
 * Email notifications for the ticket system.
 *
 * sendNewTicketAdminNotification — fires when a new ticket is created;
 *   sends to every admin.
 *
 * sendTicketReplyEmail — fires when an admin (or staff) replies to a ticket;
 *   sends to the ticket submitter.
 */
import { render } from "@react-email/components";
import { sendMailWithRetry } from "@/lib/mailer";
import { TicketCreatedEmail } from "@/lib/email/templates/ticket-created";
import { TicketReplyEmail } from "@/lib/email/templates/ticket-reply";

const FROM_NAME = process.env.EMAIL_FROM_NAME ?? "HUMI Hub";
const FROM_ADDRESS =
  process.env.EMAIL_FROM_ADDRESS ?? process.env.GMAIL_USER ?? "noreply@humihub.com";
const APP_URL = process.env.NEXTAUTH_URL ?? "https://humihub.com";

/* ------------------------------------------------------------------ */
/*  New Ticket → Admin                                                 */
/* ------------------------------------------------------------------ */

interface NewTicketAdminParams {
  readonly referenceNo: string;
  readonly subject: string;
  readonly priority: string;
  readonly category: string;
  readonly submitterName: string;
  readonly submitterType: string;
  readonly ticketId: string;
  /** Array of { name, email } for each admin to notify */
  readonly admins: ReadonlyArray<{ readonly name: string; readonly email: string }>;
}

export async function sendNewTicketAdminNotification(params: NewTicketAdminParams): Promise<void> {
  const ticketUrl = `${APP_URL}/admin/support?ticket=${params.ticketId}`;

  await Promise.allSettled(
    params.admins.map(async (admin) => {
      const html = await render(
        TicketCreatedEmail({
          referenceNo: params.referenceNo,
          subject: params.subject,
          priority: params.priority,
          category: params.category,
          submitterName: params.submitterName,
          submitterType: params.submitterType,
          adminName: admin.name,
          ticketUrl,
        })
      );

      await sendMailWithRetry(
        {
          from: `"${FROM_NAME}" <${FROM_ADDRESS}>`,
          to: admin.email,
          subject: `[${params.priority}] New Ticket ${params.referenceNo}: ${params.subject}`,
          html,
        },
        `New ticket notification to ${admin.email}`
      );
    })
  );
}

/* ------------------------------------------------------------------ */
/*  Ticket Reply → Submitter                                           */
/* ------------------------------------------------------------------ */

interface TicketReplyParams {
  readonly referenceNo: string;
  readonly subject: string;
  readonly recipientName: string;
  readonly recipientEmail: string;
  readonly responderName: string;
  readonly replyContent: string;
  readonly ticketId: string;
  readonly submitterType: string; // STUDENT | TRAINER | CORPORATE_MANAGER
}

export async function sendTicketReplyEmail(params: TicketReplyParams): Promise<void> {
  const base =
    params.submitterType === "STUDENT"
      ? "student"
      : params.submitterType === "TRAINER"
      ? "trainer"
      : "corporate";

  const ticketUrl = `${APP_URL}/${base}/support?ticket=${params.ticketId}`;

  // Truncate long replies for the email preview
  const replyPreview =
    params.replyContent.length > 300
      ? `${params.replyContent.slice(0, 300)}…`
      : params.replyContent;

  const html = await render(
    TicketReplyEmail({
      referenceNo: params.referenceNo,
      subject: params.subject,
      recipientName: params.recipientName,
      responderName: params.responderName,
      replyPreview,
      ticketUrl,
    })
  );

  await sendMailWithRetry(
    {
      from: `"${FROM_NAME}" <${FROM_ADDRESS}>`,
      to: params.recipientEmail,
      subject: `Support Reply — ${params.referenceNo}: ${params.subject}`,
      html,
    },
    `Ticket reply notification to ${params.recipientEmail}`
  );
}
