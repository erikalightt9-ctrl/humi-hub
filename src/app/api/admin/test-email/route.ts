import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { sendMail } from "@/lib/mailer";
import { getEmailSettings } from "@/lib/repositories/settings.repository";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/test-email?to=someone@example.com
 *
 * Sends a test email and returns a full diagnostic report.
 * Admin-only. Used to verify mailer config is working correctly.
 */
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const guard = requireAdmin(token);
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const to = searchParams.get("to");

  if (!to) {
    return NextResponse.json(
      { success: false, error: "Missing ?to= query param", data: null },
      { status: 400 }
    );
  }

  // Build diagnostic info
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  const fromAddr = process.env.EMAIL_FROM_ADDRESS;
  const fromName = process.env.EMAIL_FROM_NAME;
  const nextAuthUrl = process.env.NEXTAUTH_URL;

  let dbSettings: Record<string, unknown> | null = null;
  let dbError: string | null = null;
  try {
    const s = await getEmailSettings();
    dbSettings = {
      smtpHost: s.smtpHost,
      smtpPort: s.smtpPort,
      smtpUserSet: !!s.smtpUser,
      smtpPasswordSet: !!s.smtpPassword,
      fromName: s.fromName,
      fromEmail: s.fromEmail,
    };
  } catch (e) {
    dbError = String(e);
  }

  const diagnostics = {
    env: {
      GMAIL_USER: gmailUser ? `${gmailUser.slice(0, 4)}...` : "NOT SET",
      GMAIL_APP_PASSWORD: gmailPass ? "SET (hidden)" : "NOT SET",
      EMAIL_FROM_ADDRESS: fromAddr ?? "NOT SET",
      EMAIL_FROM_NAME: fromName ?? "NOT SET",
      NEXTAUTH_URL: nextAuthUrl ?? "NOT SET",
    },
    dbEmailSettings: dbSettings,
    dbError,
  };

  // Attempt to send a test email
  let sendSuccess = false;
  let sendError: string | null = null;

  try {
    await sendMail({
      from: `"${fromName ?? "VA Training Center"}" <${fromAddr ?? gmailUser ?? "noreply@vatrainingcenter.com"}>`,
      to,
      subject: "✅ VA Training Center — Mailer Test",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1d4ed8;">Mailer Test — Success!</h2>
          <p>If you're reading this, the VA Training Center mailer is configured correctly.</p>
          <p style="color: #6b7280; font-size: 13px;">Sent at: ${new Date().toISOString()}</p>
        </div>
      `,
    });
    sendSuccess = true;
  } catch (err) {
    sendError = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json({
    success: sendSuccess,
    data: {
      sentTo: to,
      sendSuccess,
      sendError,
      diagnostics,
    },
    error: sendError,
  });
}
