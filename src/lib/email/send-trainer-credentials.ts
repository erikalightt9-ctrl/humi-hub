import { sendMailWithRetry } from "@/lib/mailer";

interface TrainerCredentialsOptions {
  readonly name: string;
  readonly email: string;
  readonly temporaryPassword: string;
}

interface TrainerPasswordResetOptions {
  readonly name: string;
  readonly email: string;
  readonly temporaryPassword: string;
}

/**
 * Send an email to a trainer with their portal login credentials
 * after admin grants access.
 */
export async function sendTrainerCredentialsEmail(
  opts: TrainerCredentialsOptions,
): Promise<void> {
  const loginUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/trainer/login`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="background: #1d4ed8; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="color: #fff; margin: 0; font-size: 24px;">HUMI+ VA Training Center</h1>
    <p style="color: #bfdbfe; margin: 8px 0 0;">Trainer Portal Access</p>
  </div>
  <div style="background: #f9fafb; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="color: #1d4ed8; margin-top: 0;">Welcome, ${opts.name}!</h2>
    <p>You have been granted access to the <strong>HUMI+ Trainer Portal</strong>. You can now manage your training schedules, students, and course materials.</p>
    <div style="background: #fff; border: 1px solid #d1d5db; border-radius: 6px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 8px; font-weight: bold; color: #374151;">Your Login Credentials:</p>
      <p style="margin: 4px 0;">Email: <strong>${opts.email}</strong></p>
      <p style="margin: 4px 0;">Temporary Password: <strong style="font-family: monospace; background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${opts.temporaryPassword}</strong></p>
    </div>
    <p style="color: #ef4444; font-size: 14px;"><strong>Important:</strong> Please change your password after your first login for security.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${loginUrl}" style="background: #1d4ed8; color: #fff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px;">Access Trainer Portal</a>
    </div>
    <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 16px; margin: 24px 0;">
      <p style="margin: 0 0 8px; font-weight: bold; color: #1e40af; font-size: 14px;">What you can do in the portal:</p>
      <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px;">
        <li>View and manage your training schedule</li>
        <li>Track your assigned students</li>
        <li>Upload course materials</li>
        <li>View student ratings and feedback</li>
        <li>Update your trainer profile</li>
      </ul>
    </div>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
    <p style="color: #6b7280; font-size: 13px; margin: 0;">HUMI+ VA Training Center &bull; This email was sent to ${opts.email}</p>
  </div>
</body>
</html>`;

  const fromName =
    process.env.EMAIL_FROM_NAME ?? "HUMI+ VA Training Center";
  const fromAddr =
    process.env.EMAIL_FROM_ADDRESS ??
    process.env.GMAIL_USER ??
    "noreply@vatrainingcenter.com";

  await sendMailWithRetry(
    {
      from: `"${fromName}" <${fromAddr}>`,
      to: opts.email,
      subject:
        "Your Trainer Portal Access — HUMI+ VA Training Center",
      html,
    },
    `Trainer credentials to ${opts.email}`,
  );
}

/**
 * Send an email to a trainer with their new password
 * after admin resets it.
 */
export async function sendTrainerPasswordResetEmail(
  opts: TrainerPasswordResetOptions,
): Promise<void> {
  const loginUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/trainer/login`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="background: #1d4ed8; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="color: #fff; margin: 0; font-size: 24px;">HUMI+ VA Training Center</h1>
    <p style="color: #bfdbfe; margin: 8px 0 0;">Password Reset</p>
  </div>
  <div style="background: #f9fafb; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="color: #1d4ed8; margin-top: 0;">Password Reset</h2>
    <p>Hi <strong>${opts.name}</strong>, your Trainer Portal password has been reset by an administrator.</p>
    <div style="background: #fff; border: 1px solid #d1d5db; border-radius: 6px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 8px; font-weight: bold; color: #374151;">Your New Credentials:</p>
      <p style="margin: 4px 0;">Email: <strong>${opts.email}</strong></p>
      <p style="margin: 4px 0;">New Password: <strong style="font-family: monospace; background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${opts.temporaryPassword}</strong></p>
    </div>
    <p style="color: #ef4444; font-size: 14px;"><strong>Important:</strong> Please change this password after logging in.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${loginUrl}" style="background: #1d4ed8; color: #fff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px;">Login to Trainer Portal</a>
    </div>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
    <p style="color: #6b7280; font-size: 13px; margin: 0;">HUMI+ VA Training Center &bull; This email was sent to ${opts.email}</p>
  </div>
</body>
</html>`;

  const fromName =
    process.env.EMAIL_FROM_NAME ?? "HUMI+ VA Training Center";
  const fromAddr =
    process.env.EMAIL_FROM_ADDRESS ??
    process.env.GMAIL_USER ??
    "noreply@vatrainingcenter.com";

  await sendMailWithRetry(
    {
      from: `"${fromName}" <${fromAddr}>`,
      to: opts.email,
      subject:
        "Your Password Has Been Reset — HUMI+ VA Training Center",
      html,
    },
    `Password reset for trainer ${opts.email}`,
  );
}
