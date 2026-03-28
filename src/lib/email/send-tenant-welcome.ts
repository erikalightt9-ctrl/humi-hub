import { sendMailWithRetry } from "@/lib/mailer";

interface TenantWelcomeOptions {
  readonly orgName: string;
  readonly subdomain: string;
  readonly plan: string;
  readonly adminName: string;
  readonly adminEmail: string;
  readonly temporaryPassword: string;
}

/**
 * Send a welcome email to a newly-created tenant's admin account.
 * Includes login credentials and a getting-started checklist.
 */
export async function sendTenantWelcomeEmail(opts: TenantWelcomeOptions): Promise<void> {
  const rootDomain = process.env.ROOT_DOMAIN ?? "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const portalUrl = `${protocol}://${opts.subdomain}.${rootDomain}/corporate/login`;
  const supportEmail = process.env.SUPPORT_EMAIL ?? "support@vatrainingcenter.com";

  const planLabel =
    opts.plan.charAt(0) + opts.plan.slice(1).toLowerCase(); // e.g. "Trial", "Starter"

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 20px; color: #1f2937; background: #f9fafb;">

  <!-- Header -->
  <div style="background: linear-gradient(135deg, #1d4ed8 0%, #4338ca 100%); padding: 32px 28px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: #fff; margin: 0; font-size: 26px; letter-spacing: -0.3px;">Welcome to VA Training Center</h1>
    <p style="color: #c7d2fe; margin: 10px 0 0; font-size: 15px;">Your organization portal is ready</p>
  </div>

  <!-- Body -->
  <div style="background: #ffffff; padding: 36px 28px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">

    <h2 style="color: #1d4ed8; margin-top: 0; font-size: 20px;">Hi ${opts.adminName}!</h2>
    <p style="line-height: 1.6; color: #374151;">
      Your organization <strong>${opts.orgName}</strong> has been set up on the
      <strong>${planLabel}</strong> plan. You're the admin — here are your login credentials to get started.
    </p>

    <!-- Credentials box -->
    <div style="background: #f8faff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 12px; font-weight: 700; color: #1e40af; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Your Login Credentials</p>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="padding: 4px 0; color: #6b7280; width: 130px;">Email</td>
          <td style="padding: 4px 0; color: #111827; font-weight: 600;">${opts.adminEmail}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #6b7280;">Temporary Password</td>
          <td style="padding: 4px 0;">
            <code style="background: #ede9fe; color: #5b21b6; padding: 3px 8px; border-radius: 4px; font-size: 13px; letter-spacing: 0.5px;">${opts.temporaryPassword}</code>
          </td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #6b7280;">Organization</td>
          <td style="padding: 4px 0; color: #111827; font-weight: 600;">${opts.orgName}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #6b7280;">Plan</td>
          <td style="padding: 4px 0; color: #111827; font-weight: 600;">${planLabel}</td>
        </tr>
      </table>
    </div>

    <p style="color: #dc2626; font-size: 13px; margin: -8px 0 24px;">
      ⚠️ <strong>Please change your password</strong> immediately after your first login.
    </p>

    <!-- CTA button -->
    <div style="text-align: center; margin: 32px 0;">
      <a href="${portalUrl}"
         style="background: #1d4ed8; color: #ffffff; padding: 14px 36px; border-radius: 8px;
                text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block;">
        Access Your Portal →
      </a>
    </div>

    <!-- Getting started checklist -->
    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 12px; font-weight: 700; color: #15803d; font-size: 14px;">Getting Started Checklist</p>
      <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px; line-height: 2;">
        <li>Log in and change your temporary password</li>
        <li>Complete your organization profile (branding, logo, mission)</li>
        <li>Invite your team members as employees</li>
        <li>Enroll employees in available courses</li>
        <li>Track progress from the Reports dashboard</li>
      </ul>
    </div>

    <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 28px 0;">

    <p style="color: #6b7280; font-size: 13px; margin: 0; line-height: 1.6;">
      Questions? Reply to this email or reach us at
      <a href="mailto:${supportEmail}" style="color: #1d4ed8;">${supportEmail}</a>.<br>
      VA Training Center &bull; Empowering teams through learning.
    </p>
  </div>

</body>
</html>`;

  const fromName = process.env.EMAIL_FROM_NAME ?? "VA Training Center";
  const fromAddr =
    process.env.EMAIL_FROM_ADDRESS ??
    process.env.GMAIL_USER ??
    "noreply@vatrainingcenter.com";

  await sendMailWithRetry(
    {
      from: `"${fromName}" <${fromAddr}>`,
      to: opts.adminEmail,
      subject: `Welcome to VA Training Center — Your ${planLabel} Portal is Ready`,
      html,
    },
    `Tenant welcome email to ${opts.adminEmail} (${opts.orgName})`,
  );
}
