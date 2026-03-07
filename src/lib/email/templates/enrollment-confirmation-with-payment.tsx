import { Text, Section, Link } from "@react-email/components";
import { BaseLayout } from "./base-layout";

interface EnrollmentConfirmationWithPaymentEmailProps {
  readonly fullName: string;
  readonly courseTitle: string;
  readonly enrollmentId: string;
  readonly submittedAt: string;
  readonly paymentUrl: string;
  readonly statusTrackingUrl: string;
}

export function EnrollmentConfirmationWithPaymentEmail({
  fullName,
  courseTitle,
  enrollmentId,
  submittedAt,
  paymentUrl,
  statusTrackingUrl,
}: EnrollmentConfirmationWithPaymentEmailProps) {
  return (
    <BaseLayout previewText={`Application received for ${courseTitle}`}>
      <Text style={styles.heading}>Application Received!</Text>

      <Text style={styles.text}>
        Hi <strong>{fullName}</strong>,
      </Text>

      <Text style={styles.text}>
        Thank you for submitting your enrollment application for{" "}
        <strong>{courseTitle}</strong>. We have received your application
        successfully.
      </Text>

      <Section style={styles.detailsBox}>
        <Text style={styles.detailsTitle}>Application Summary</Text>
        <Text style={styles.detailRow}>
          <strong>Name:</strong> {fullName}
        </Text>
        <Text style={styles.detailRow}>
          <strong>Course:</strong> {courseTitle}
        </Text>
        <Text style={styles.detailRow}>
          <strong>Application ID:</strong> {enrollmentId}
        </Text>
        <Text style={styles.detailRow}>
          <strong>Submitted:</strong> {submittedAt}
        </Text>
      </Section>

      <Text style={styles.heading2}>Next Step: Complete Payment</Text>

      <Text style={styles.text}>
        To continue with your enrollment, please complete your payment. Your
        application will not be processed until payment has been received.
      </Text>

      <Section style={{ textAlign: "center" as const, margin: "28px 0" }}>
        <Link href={paymentUrl} style={styles.ctaButton}>
          Complete Payment
        </Link>
      </Section>

      <Text style={styles.text}>
        Track your enrollment status anytime:{" "}
        <Link href={statusTrackingUrl} style={styles.link}>
          View My Status
        </Link>
      </Text>

      <Text style={styles.textMuted}>
        If you have any questions about payment or the enrollment process, feel
        free to reach out to our support team.
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
  link: {
    color: "#1d4ed8",
    textDecoration: "underline",
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
