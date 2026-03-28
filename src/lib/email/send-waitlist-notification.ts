import { render } from "@react-email/components";
import { sendMailWithRetry } from "@/lib/mailer";
import { WaitlistJoinedEmail } from "@/lib/email/templates/waitlist-joined";
import { WaitlistPromotedEmail } from "@/lib/email/templates/waitlist-promoted";

const FROM_NAME = process.env.EMAIL_FROM_NAME ?? "HUMI Training Center";
const FROM_ADDRESS =
  process.env.EMAIL_FROM_ADDRESS ??
  process.env.GMAIL_USER ??
  "noreply@vatrainingcenter.com";

/* ------------------------------------------------------------------ */
/*  Waitlist Joined                                                     */
/* ------------------------------------------------------------------ */

export async function sendWaitlistJoinedEmail(params: {
  readonly email: string;
  readonly fullName: string;
  readonly courseTitle: string;
  readonly scheduleName: string;
  readonly position: number;
}): Promise<void> {
  const html = await render(
    WaitlistJoinedEmail({
      fullName: params.fullName,
      courseTitle: params.courseTitle,
      scheduleName: params.scheduleName,
      position: params.position,
    }),
  );

  await sendMailWithRetry(
    {
      from: `"${FROM_NAME}" <${FROM_ADDRESS}>`,
      to: params.email,
      subject: `You're on the Waitlist — ${params.scheduleName} | HUMI Training Center`,
      html,
    },
    `Waitlist joined to ${params.email}`,
  );
}

/* ------------------------------------------------------------------ */
/*  Waitlist Promoted (seat opened)                                    */
/* ------------------------------------------------------------------ */

export async function sendWaitlistPromotedEmail(params: {
  readonly email: string;
  readonly fullName: string;
  readonly courseTitle: string;
  readonly scheduleName: string;
  readonly enrollmentId: string;
}): Promise<void> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://vatrainingcenter.com";
  const confirmUrl = `${baseUrl}/enrollment-status?id=${params.enrollmentId}`;

  const html = await render(
    WaitlistPromotedEmail({
      fullName: params.fullName,
      courseTitle: params.courseTitle,
      scheduleName: params.scheduleName,
      confirmUrl,
    }),
  );

  await sendMailWithRetry(
    {
      from: `"${FROM_NAME}" <${FROM_ADDRESS}>`,
      to: params.email,
      subject: `A Seat Is Available — ${params.scheduleName} | HUMI Training Center`,
      html,
    },
    `Waitlist promotion to ${params.email}`,
  );
}
