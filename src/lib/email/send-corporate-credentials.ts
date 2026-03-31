import { sendMailWithRetry } from "@/lib/mailer";

interface CorporateCredentialsOptions {
  readonly name: string;
  readonly email: string;
  readonly organizationName: string;
  readonly temporaryPassword: string;
  readonly role: "employee" | "manager";
}

/**
 * Send a welcome email to a newly added corporate employee or manager
 * with their portal login credentials.
 */
export async function sendCorporateCredentialsEmail(
  opts: CorporateCredentialsOptions,
): Promise<void> {
  const loginUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/corporate/login`;

  const roleLabel = opts.role === "manager" ? "Manager" : "Employee";
  const portalLabel = opts.role === "manager" ? "Corporate Manager Portal" : "Corporate Portal";

  const bulletPoints =
    opts.role === "manager"
      ? `
        <li>Manage your organization's employees and enrollments</li>
        <li>Track training progress and course completions</li>
        <li>View reports and analytics for your team</li>
        <li>Communicate with trainers and administrators</li>
      `
      : `
        <li>Access your assigned training courses</li>
        <li>Track your learning progress</li>
        <li>View your certificates and completions</li>
        <li>Communicate with your trainers</li>
      `;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="background: #1d4ed8; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="color: #fff; margin: 0; font-size: 24px;">HUMI Hub</h1>
    <p style="color: #bfdbfe; margin: 8px 0 0;">${portalLabel}</p>
  </div>
  <div style="background: #f9fafb; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="color: #1d4ed8; margin-top: 0;">Welcome, ${opts.name}!</h2>
    <p>You have been added as a <strong>${roleLabel}</strong> at <strong>${opts.organizationName}</strong> on the HUMI Hub platform. Your account is now ready.</p>
    <div style="background: #fff; border: 1px solid #d1d5db; border-radius: 6px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 8px; font-weight: bold; color: #374151;">Your Login Credentials:</p>
      <p style="margin: 4px 0;">Email: <strong>${opts.email}</strong></p>
      <p style="margin: 4px 0;">Temporary Password: <strong style="font-family: monospace; background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${opts.temporaryPassword}</strong></p>
    </div>
    <p style="color: #ef4444; font-size: 14px;"><strong>Important:</strong> Please change your password after your first login for security.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${loginUrl}" style="background: #1d4ed8; color: #fff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px;">Access ${portalLabel}</a>
    </div>
    <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 16px; margin: 24px 0;">
      <p style="margin: 0 0 8px; font-weight: bold; color: #1e40af; font-size: 14px;">What you can do in the portal:</p>
      <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px;">
        ${bulletPoints}
      </ul>
    </div>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
    <p style="color: #6b7280; font-size: 13px; margin: 0;">HUMI Hub &bull; This email was sent to ${opts.email}</p>
  </div>
</body>
</html>`;

  const fromName = process.env.EMAIL_FROM_NAME ?? "HUMI Hub";
  const fromAddr =
    process.env.EMAIL_FROM_ADDRESS ??
    process.env.GMAIL_USER ??
    "noreply@humihub.com";

  await sendMailWithRetry(
    {
      from: `"${fromName}" <${fromAddr}>`,
      to: opts.email,
      subject: `Welcome to ${opts.organizationName} — Your ${portalLabel} Access | HUMI Hub`,
      html,
    },
    `Corporate ${roleLabel.toLowerCase()} credentials to ${opts.email}`,
  );
}
