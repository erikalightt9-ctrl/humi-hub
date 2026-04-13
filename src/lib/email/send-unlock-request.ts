import { sendMailWithRetry } from "@/lib/mailer";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

interface UnlockRequestOptions {
  readonly adminEmail: string;
  readonly lockedUserEmail: string;
  readonly lockedUserName: string;
  readonly userRole: string;
  readonly lockUntil: Date;
  readonly adminPanelUrl: string;
}

const ROLE_LABEL: Record<string, string> = {
  student: "Student",
  trainer: "Trainer",
  corporate: "Corporate Manager",
  "humi-admin": "HUMI Admin",
};

export async function sendUnlockRequestEmail(opts: UnlockRequestOptions): Promise<void> {
  const roleLabel = ROLE_LABEL[opts.userRole] ?? "User";
  const lockTimeStr =
    opts.lockUntil.toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    }) + " UTC";

  const safeName = escapeHtml(opts.lockedUserName);
  const safeEmail = escapeHtml(opts.lockedUserEmail);
  const safeRole = escapeHtml(roleLabel);

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="background: #dc2626; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="color: #fff; margin: 0; font-size: 24px;">HUMI Hub</h1>
    <p style="color: #fecaca; margin: 8px 0 0;">Account Unlock Request</p>
  </div>
  <div style="background: #f9fafb; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <div style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
      <p style="margin: 0; color: #b91c1c; font-weight: bold;">&#9888; Account Locked — Action Required</p>
    </div>

    <h2 style="color: #111827; margin-top: 0;">A user is requesting account unlock</h2>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <tr>
        <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 140px;">Name</td>
        <td style="padding: 8px 0; font-weight: 600;">${safeName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email</td>
        <td style="padding: 8px 0; font-weight: 600;">${safeEmail}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Role</td>
        <td style="padding: 8px 0;">${safeRole}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Auto-unlock at</td>
        <td style="padding: 8px 0; color: #dc2626;">${lockTimeStr}</td>
      </tr>
    </table>

    <p style="color: #374151;">
      The user has submitted an unlock request. You can unlock their account immediately from the admin panel,
      or the account will auto-unlock at the time shown above.
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${opts.adminPanelUrl}"
         style="background: #1d4ed8; color: #fff; padding: 14px 32px; border-radius: 6px;
                text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
        Go to Admin Panel
      </a>
    </div>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
      If you do not recognise this user, you can ignore this email — the account will auto-unlock after the cooldown period.<br><br>
      HUMI Hub &bull; Automated Security Alert
    </p>
  </div>
</body>
</html>`;

  const fromName = process.env.EMAIL_FROM_NAME ?? "HUMI Hub";
  const fromAddr = process.env.EMAIL_FROM_ADDRESS ?? process.env.GMAIL_USER ?? "noreply@humihub.com";

  await sendMailWithRetry(
    {
      from: `"${fromName}" <${fromAddr}>`,
      to: opts.adminEmail,
      subject: `[HUMI Hub] Account Unlock Request — ${opts.lockedUserName} (${roleLabel})`,
      html,
    },
    `Unlock request notification to ${opts.adminEmail}`,
  );
}
