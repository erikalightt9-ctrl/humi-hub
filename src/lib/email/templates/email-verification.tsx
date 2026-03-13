import { Text, Section, Link } from "@react-email/components";
import { BaseLayout } from "./base-layout";

interface EmailVerificationEmailProps {
  readonly name: string;
  readonly courseTitle: string;
  readonly verificationUrl: string;
  readonly expiresInHours: number;
}

export function EmailVerificationEmail({
  name,
  courseTitle,
  verificationUrl,
  expiresInHours,
}: EmailVerificationEmailProps) {
  return (
    <BaseLayout previewText="Verify your email address">
      <Text style={styles.heading}>Verify Your Email</Text>

      <Text style={styles.text}>
        Hi <strong>{name}</strong>,
      </Text>

      <Text style={styles.text}>
        Your payment for <strong>{courseTitle}</strong> has been verified! Please
        verify your email address to continue the enrollment process.
      </Text>

      <Section style={{ textAlign: "center" as const, margin: "28px 0" }}>
        <Link href={verificationUrl} style={styles.ctaButton}>
          Verify My Email
        </Link>
      </Section>

      <Text style={styles.textMuted}>
        This link will expire in {expiresInHours} hours. If you did not enroll
        at HUMI Training Center, please ignore this email.
      </Text>
    </BaseLayout>
  );
}

const styles = {
  heading: {
    fontSize: "22px",
    fontWeight: "bold" as const,
    color: "#374151",
    margin: "0 0 16px" as const,
  },
  text: {
    fontSize: "15px",
    color: "#374151",
    lineHeight: "1.6",
    margin: "0 0 12px" as const,
  },
  textMuted: {
    fontSize: "14px",
    color: "#6b7280",
    lineHeight: "1.6",
    margin: "24px 0 0" as const,
  },
  ctaButton: {
    display: "inline-block" as const,
    backgroundColor: "#1d4ed8",
    color: "#ffffff",
    padding: "14px 32px",
    borderRadius: "6px",
    textDecoration: "none",
    fontWeight: "bold" as const,
    fontSize: "16px",
  },
} as const;
