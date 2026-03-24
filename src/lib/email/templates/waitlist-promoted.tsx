import { Text, Section, Button } from "@react-email/components";
import { BaseLayout } from "./base-layout";

interface WaitlistPromotedEmailProps {
  readonly fullName: string;
  readonly courseTitle: string;
  readonly scheduleName: string;
  readonly confirmUrl: string;
}

export function WaitlistPromotedEmail({
  fullName,
  courseTitle,
  scheduleName,
  confirmUrl,
}: WaitlistPromotedEmailProps) {
  return (
    <BaseLayout previewText={`A seat opened up in ${scheduleName} — confirm now!`}>
      <Text style={styles.heading}>A Seat Is Available!</Text>

      <Text style={styles.text}>
        Hi <strong>{fullName}</strong>,
      </Text>

      <Text style={styles.text}>
        Great news! A seat has opened up in the <strong>{scheduleName}</strong> session
        for <strong>{courseTitle}</strong>. You're next on the waitlist!
      </Text>

      <Section style={styles.alertBox}>
        <Text style={styles.alertText}>
          ⏰ You have <strong>48 hours</strong> to confirm your enrollment. After that,
          the seat will be offered to the next person on the waitlist.
        </Text>
      </Section>

      <Section style={styles.detailsBox}>
        <Text style={styles.detailsTitle}>Session Details</Text>
        <Text style={styles.detailRow}>
          <strong>Course:</strong> {courseTitle}
        </Text>
        <Text style={styles.detailRow}>
          <strong>Session:</strong> {scheduleName}
        </Text>
      </Section>

      <Section style={{ textAlign: "center" as const, margin: "24px 0" }}>
        <Button
          href={confirmUrl}
          style={styles.button}
        >
          Confirm My Enrollment
        </Button>
      </Section>

      <Text style={styles.smallText}>
        If you no longer wish to enroll, simply ignore this email and the seat will be
        passed to the next applicant.
      </Text>
    </BaseLayout>
  );
}

const styles = {
  heading: {
    fontSize: "22px",
    fontWeight: "bold" as const,
    color: "#15803d",
    margin: "0 0 16px" as const,
  },
  text: {
    fontSize: "15px",
    lineHeight: "1.6",
    color: "#374151",
    margin: "0 0 12px" as const,
  },
  alertBox: {
    backgroundColor: "#fef3c7",
    borderLeft: "4px solid #d97706",
    borderRadius: "4px",
    padding: "14px 18px",
    margin: "16px 0",
  },
  alertText: {
    fontSize: "14px",
    color: "#92400e",
    margin: "0",
  },
  detailsBox: {
    backgroundColor: "#f0fdf4",
    borderLeft: "4px solid #22c55e",
    borderRadius: "4px",
    padding: "16px 20px",
    margin: "20px 0",
  },
  detailsTitle: {
    fontSize: "13px",
    fontWeight: "bold" as const,
    color: "#15803d",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    margin: "0 0 12px" as const,
  },
  detailRow: {
    fontSize: "14px",
    color: "#374151",
    margin: "0 0 6px" as const,
  },
  button: {
    backgroundColor: "#16a34a",
    color: "#ffffff",
    padding: "12px 28px",
    borderRadius: "6px",
    fontWeight: "bold" as const,
    fontSize: "15px",
    textDecoration: "none",
    display: "inline-block" as const,
  },
  smallText: {
    fontSize: "13px",
    color: "#6b7280",
    margin: "0",
  },
} as const;
