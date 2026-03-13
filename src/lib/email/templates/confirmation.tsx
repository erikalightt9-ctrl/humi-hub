import { Text, Section } from "@react-email/components";
import { BaseLayout } from "./base-layout";

interface ConfirmationEmailProps {
  readonly fullName: string;
  readonly courseTitle: string;
  readonly enrollmentId: string;
  readonly submittedAt: string;
}

export function ConfirmationEmail({
  fullName,
  courseTitle,
  enrollmentId,
  submittedAt,
}: ConfirmationEmailProps) {
  return (
    <BaseLayout previewText={`Application received for ${courseTitle}`}>
      <Text style={styles.heading}>Application Received!</Text>

      <Text style={styles.text}>
        Hi <strong>{fullName}</strong>,
      </Text>

      <Text style={styles.text}>
        Thank you for submitting your enrollment application for{" "}
        <strong>{courseTitle}</strong>. We have received your application and
        our team will review it shortly.
      </Text>

      <Section style={styles.detailsBox}>
        <Text style={styles.detailsTitle}>Application Details</Text>
        <Text style={styles.detailRow}>
          <strong>Course:</strong> {courseTitle}
        </Text>
        <Text style={styles.detailRow}>
          <strong>Application ID:</strong> {enrollmentId}
        </Text>
        <Text style={styles.detailRow}>
          <strong>Submitted:</strong> {submittedAt}
        </Text>
        <Text style={styles.detailRow}>
          <strong>Status:</strong> Under Review
        </Text>
      </Section>

      <Text style={styles.heading2}>What Happens Next?</Text>

      <Text style={styles.text}>
        1. Our team will review your application within 24-48 hours.
      </Text>
      <Text style={styles.text}>
        2. You will receive an email with the result of your application.
      </Text>
      <Text style={styles.text}>
        3. If approved, you will receive a payment link and portal access.
      </Text>

      <Text style={styles.textMuted}>
        If you have any questions, feel free to reach out to our support team.
      </Text>
    </BaseLayout>
  );
}

const styles = {
  heading: {
    fontSize: "22px",
    fontWeight: "bold" as const,
    color: "#1d4ed8",
    margin: "0 0 16px" as const,
  },
  heading2: {
    fontSize: "16px",
    fontWeight: "bold" as const,
    color: "#374151",
    margin: "24px 0 8px" as const,
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
  detailsBox: {
    backgroundColor: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    padding: "16px 20px",
    margin: "20px 0" as const,
  },
  detailsTitle: {
    fontSize: "14px",
    fontWeight: "bold" as const,
    color: "#374151",
    margin: "0 0 12px" as const,
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  detailRow: {
    fontSize: "14px",
    color: "#4b5563",
    margin: "4px 0" as const,
    lineHeight: "1.5",
  },
} as const;
