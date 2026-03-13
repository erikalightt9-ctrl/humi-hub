import { Text, Section, Link } from "@react-email/components";
import { BaseLayout } from "./base-layout";

interface PasswordResetEmailProps {
  readonly name: string;
  readonly email: string;
  readonly resetUrl: string;
  readonly expiresInMinutes: number;
}

export function PasswordResetEmail({
  name,
  resetUrl,
  expiresInMinutes,
}: PasswordResetEmailProps) {
  return (
    <BaseLayout previewText="Reset your HUMI Training Center password">
      <Text style={styles.heading}>Password Reset</Text>
      <Text style={styles.text}>Hi <strong>{name}</strong>,</Text>
      <Text style={styles.text}>
        We received a request to reset your password. Click the button below to set a new password.
      </Text>
      <Section style={{ textAlign: "center" as const, margin: "28px 0" }}>
        <Link href={resetUrl} style={styles.ctaButton}>Reset Password</Link>
      </Section>
      <Text style={styles.textMuted}>
        This link will expire in {expiresInMinutes} minutes. If you did not request a
        password reset, please ignore this email. Your password will remain unchanged.
      </Text>
    </BaseLayout>
  );
}

const styles = {
  heading: { fontSize: "22px", fontWeight: "bold" as const, color: "#374151", margin: "0 0 16px" as const },
  text: { fontSize: "15px", color: "#374151", lineHeight: "1.6", margin: "0 0 12px" as const },
  textMuted: { fontSize: "14px", color: "#6b7280", lineHeight: "1.6", margin: "24px 0 0" as const },
  ctaButton: { display: "inline-block" as const, backgroundColor: "#1d4ed8", color: "#ffffff", padding: "14px 32px", borderRadius: "6px", textDecoration: "none", fontWeight: "bold" as const, fontSize: "16px" },
} as const;
