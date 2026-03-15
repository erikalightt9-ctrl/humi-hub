import nodemailer from "nodemailer";
import { getEmailSettings } from "@/lib/repositories/settings.repository";

/* ------------------------------------------------------------------ */
/*  Dynamic transporter                                                */
/* ------------------------------------------------------------------ */

/**
 * Creates a nodemailer transporter.
 * Priority: DB email_settings → env vars (GMAIL_USER / GMAIL_APP_PASSWORD) → null (dev mode)
 */
async function getDynamicTransporter(): Promise<nodemailer.Transporter | null> {
  // Try DB settings first
  try {
    const settings = await getEmailSettings();
    if (settings.smtpUser && settings.smtpPassword) {
      return nodemailer.createTransport({
        host: settings.smtpHost,
        port: settings.smtpPort,
        secure: settings.smtpPort === 465,
        auth: { user: settings.smtpUser, pass: settings.smtpPassword },
      });
    }
  } catch {
    /* DB unavailable — fall through to env vars */
  }

  // Fall back to env vars
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (gmailUser && gmailPass) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: { user: gmailUser, pass: gmailPass },
    });
  }

  console.warn(
    "[Mailer] No SMTP credentials configured (DB or env vars). " +
      "Emails will be logged to console only.",
  );
  return null;
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

export interface SendMailOptions {
  readonly from: string;
  readonly to: string;
  readonly subject: string;
  readonly html: string;
}

/**
 * Sends an email. Falls back to console logging when email is not configured.
 * Throws on actual send failures so callers can handle retries.
 */
export async function sendMail(options: SendMailOptions): Promise<void> {
  const transporter = await getDynamicTransporter();

  if (!transporter) {
    console.log(
      `[Mailer][DEV] Would send email:\n` +
        `  To: ${options.to}\n` +
        `  Subject: ${options.subject}\n` +
        `  From: ${options.from}`,
    );
    return;
  }

  const result = await transporter.sendMail(options);
  console.log(`[Mailer] Email sent to ${options.to} — messageId: ${result.messageId}`);
}

/**
 * Sends an email with automatic retry (1 retry after 2s delay).
 * Logs errors without throwing so callers can fire-and-forget safely.
 */
export async function sendMailWithRetry(
  options: SendMailOptions,
  label: string,
): Promise<boolean> {
  try {
    await sendMail(options);
    return true;
  } catch (err) {
    console.error(`[Mailer] ${label} — first attempt failed:`, err);

    // Retry once after 2 seconds
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await sendMail(options);
      console.log(`[Mailer] ${label} — retry succeeded`);
      return true;
    } catch (retryErr) {
      console.error(`[Mailer] ${label} — retry also failed:`, retryErr);
      return false;
    }
  }
}

/** @deprecated Use sendMail or sendMailWithRetry instead */
export const transporter = null;
