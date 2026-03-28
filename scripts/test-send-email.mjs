/**
 * Quick one-off script to test Gmail sending directly.
 * Run: node scripts/test-send-email.mjs
 */
import nodemailer from "nodemailer";

const GMAIL_USER = "gdscapital.168@gmail.com";
const GMAIL_APP_PASSWORD = "ogjg xzlb hehq sbhk";
const TO = "tuluson09@gmail.com";

console.log("Creating Gmail transporter...");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
});

console.log("Verifying connection...");
try {
  await transporter.verify();
  console.log("✅ SMTP connection OK");
} catch (err) {
  console.error("❌ SMTP connection FAILED:", err.message);
  process.exit(1);
}

console.log(`Sending test email to ${TO}...`);
try {
  const result = await transporter.sendMail({
    from: `"VA Training Center" <${GMAIL_USER}>`,
    to: TO,
    subject: "✅ VA Training Center — Test Email",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
        <div style="background: #1d4ed8; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 22px;">HUMI Training Center</h1>
        </div>
        <div style="background: #f9fafb; padding: 28px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1d4ed8; margin-top: 0;">Welcome to PDMN!</h2>
          <p>Hi <strong>Maria Reyes</strong>, your corporate portal account has been set up.</p>
          <div style="background: #fff; border: 1px solid #d1d5db; border-radius: 6px; padding: 18px; margin: 20px 0;">
            <p style="margin: 0 0 6px; font-weight: bold; color: #374151;">Your Login Credentials:</p>
            <p style="margin: 4px 0;">Email: <strong>tuluson09@gmail.com</strong></p>
            <p style="margin: 4px 0;">Temporary Password: <strong style="font-family: monospace; background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">ChangeMe@123!</strong></p>
          </div>
          <p style="color: #ef4444; font-size: 14px;"><strong>Important:</strong> Please change your password after your first login.</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="https://va-training-center.vercel.app/corporate/login"
               style="background: #1d4ed8; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              Access Corporate Portal
            </a>
          </div>
          <p style="color: #6b7280; font-size: 12px; margin: 0;">Sent at: ${new Date().toISOString()}</p>
        </div>
      </div>
    `,
  });
  console.log("✅ Email sent! Message ID:", result.messageId);
} catch (err) {
  console.error("❌ Send failed:", err.message);
  if (err.responseCode) console.error("   SMTP response code:", err.responseCode);
  if (err.response) console.error("   SMTP response:", err.response);
}
