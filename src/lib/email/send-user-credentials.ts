import { sendMailWithRetry } from "@/lib/mailer";

interface TenantUserCredentialsOptions {
  readonly name: string;
  readonly email: string;
  readonly organizationName: string;
  readonly roleLabel: string;
  readonly temporaryPassword: string;
  readonly permissions: string[];
}

const MODULE_LABELS: Record<string, string> = {
  module_lms:        "Learning Management",
  module_hr:         "Human Resources",
  module_accounting: "Accounting & Finance",
  module_marketing:  "Marketing",
  module_inventory:  "Inventory",
  module_sales:      "Sales & CRM",
  module_it:         "IT Management",
  module_admin:      "Admin Department",
};

export async function sendTenantUserCredentialsEmail(
  opts: TenantUserCredentialsOptions,
): Promise<void> {
  const loginUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/corporate/login`;

  const moduleList = opts.permissions.length > 0
    ? opts.permissions.map((p) => `<li>${MODULE_LABELS[p] ?? p}</li>`).join("")
    : "<li>Contact your admin for module access</li>";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="background: #1d4ed8; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="color: #fff; margin: 0; font-size: 24px;">HUMI Hub</h1>
    <p style="color: #bfdbfe; margin: 8px 0 0;">Your Workspace Access</p>
  </div>
  <div style="background: #f9fafb; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="color: #1d4ed8; margin-top: 0;">Welcome, ${opts.name}!</h2>
    <p>
      You have been added as <strong>${opts.roleLabel}</strong> at
      <strong>${opts.organizationName}</strong> on the HUMI Hub platform.
      Your account is now ready to use.
    </p>

    <div style="background: #fff; border: 1px solid #d1d5db; border-radius: 6px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 8px; font-weight: bold; color: #374151;">Your Login Credentials:</p>
      <p style="margin: 4px 0;">📧 Email: <strong>${opts.email}</strong></p>
      <p style="margin: 4px 0;">🔑 Temporary Password:
        <strong style="font-family: monospace; background: #f3f4f6; padding: 2px 8px; border-radius: 4px; letter-spacing: 1px;">
          ${opts.temporaryPassword}
        </strong>
      </p>
    </div>

    <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 6px; padding: 12px 16px; margin-bottom: 24px;">
      <p style="margin: 0; color: #92400e; font-size: 14px;">
        <strong>⚠️ Important:</strong> You will be asked to change your password on your first login.
        Keep this email confidential — your admin cannot view your password after it is changed.
      </p>
    </div>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${loginUrl}"
         style="background: #1d4ed8; color: #fff; padding: 14px 36px; border-radius: 6px;
                text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
        Sign In to HUMI Hub
      </a>
    </div>

    <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 16px; margin: 24px 0;">
      <p style="margin: 0 0 8px; font-weight: bold; color: #1e40af; font-size: 14px;">
        Your module access:
      </p>
      <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px;">
        ${moduleList}
      </ul>
    </div>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
    <p style="color: #6b7280; font-size: 13px; margin: 0;">
      HUMI Hub &bull; This email was sent to ${opts.email} &bull;
      <a href="${loginUrl}" style="color: #6b7280;">Login Portal</a>
    </p>
  </div>
</body>
</html>`;

  const fromName = process.env.EMAIL_FROM_NAME ?? "HUMI Hub";
  const fromAddr = process.env.EMAIL_FROM_ADDRESS ?? process.env.GMAIL_USER ?? "noreply@humihub.com";

  await sendMailWithRetry(
    {
      from: `"${fromName}" <${fromAddr}>`,
      to: opts.email,
      subject: `Welcome to ${opts.organizationName} — Your HUMI Hub Access`,
      html,
    },
    `Tenant user credentials to ${opts.email}`,
  );
}
