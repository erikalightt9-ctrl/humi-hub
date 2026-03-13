import { Text, Section, Link } from "@react-email/components";
import { BaseLayout } from "./base-layout";

interface AccountActivationEmailProps {
  readonly name: string;
  readonly courseTitle: string;
  readonly activationUrl: string;
  readonly statusTrackingUrl: string;
  readonly expiresInHours: number;
}

export function AccountActivationEmail({
  name,
  courseTitle,
  activationUrl,
  statusTrackingUrl,
  expiresInHours,
}: AccountActivationEmailProps) {
  return (
    <BaseLayout previewText={`Your enrollment for ${courseTitle} has been approved!`}>
      <Text style={styles.heading}>Congratulations!</Text>

      <Text style={styles.text}>
        Hi <strong>{name}</strong>,
      </Text>

      <Text style={styles.text}>
        Your enrollment for <strong>{courseTitle}</strong> has been approved.
        Create your password below to activate your student account and get
        started with the learning portal.
      </Text>

      <Section style={{ textAlign: "center" as const, margin: "28px 0" }}>
        <Link href={activationUrl} style={styles.ctaButton}>
          Create Your Password
        </Link>
      </Section>

      <Text style={styles.text}>
        You can also track your enrollment status anytime at:{" "}
        <Link href={statusTrackingUrl} style={styles.link}>
          View My Status
        </Link>
      </Text>

      <Text style={styles.textMuted}>
        This activation link will expire in {expiresInHours} hours. If you did
        not enroll at HUMI Training Center, please ignore this email.
      </Text>
    </BaseLayout>
  );
}

const styles = {
  heading: {
    fontSize: "22px",
    fontWeight: "bold" as const,
    color: "#16a34a",
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
  link: {
    color: "#1d4ed8",
    textDecoration: "underline",
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
