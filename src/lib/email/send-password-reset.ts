import { sendMailWithRetry } from "@/lib/mailer";

interface PasswordResetOptions {
  readonly email: string;
  readonly resetLink: string;
  readonly userType: string;
}

const USER_TYPE_LABEL: Record<string, string> = {
  student: "Student",
  admin: "Admin",
  trainer: "Trainer",
  manager: "Manager",
};

export async function sendPasswordResetEmail(
  opts: PasswordResetOptions,
): Promise<void> {
  const label = USER_TYPE_LABEL[opts.userType] ?? "User";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="background: #1d4ed8; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="color: #fff; margin: 0; font-size: 24px;">HUMI Hub</h1>
    <p style="color: #bfdbfe; margin: 8px 0 0;">Password Reset Request</p>
  </div>
  <div style="background: #f9fafb; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="color: #1d4ed8; margin-top: 0;">Reset Your Password</h2>
    <p>We received a request to reset the password for your <strong>${label}</strong> account associated with <strong>${opts.email}</strong>.</p>
    <p>Click the button below to set a new password. This link is valid for <strong>1 hour</strong>.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${opts.resetLink}"
         style="background: #1d4ed8; color: #fff; padding: 14px 32px; border-radius: 6px;
                text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
        Reset My Password
      </a>
    </div>
    <p style="color: #6b7280; font-size: 13px;">
      Or copy and paste this link into your browser:<br>
      <a href="${opts.resetLink}" style="color: #1d4ed8; word-break: break-all;">${opts.resetLink}</a>
    </p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
      If you did not request a password reset, you can safely ignore this email —
      your password will remain unchanged.<br><br>
      HUMI Hub &bull; This email was sent to ${opts.email}
    </p>
  </div>
</body>
</html>`;

  const fromName =
    process.env.EMAIL_FROM_NAME ?? "HUMI Hub";
  const fromAddr =
    process.env.EMAIL_FROM_ADDRESS ??
    process.env.GMAIL_USER ??
    "noreply@humihub.com";

  await sendMailWithRetry(
    {
      from: `"${fromName}" <${fromAddr}>`,
      to: opts.email,
      subject: "Reset Your Password — HUMI Hub",
      html,
    },
    `Password reset to ${opts.email}`,
  );
}
