import { Text, Section } from "@react-email/components";
import { BaseLayout } from "./base-layout";

interface WaitlistJoinedEmailProps {
  readonly fullName: string;
  readonly courseTitle: string;
  readonly scheduleName: string;
  readonly position: number;
}

export function WaitlistJoinedEmail({
  fullName,
  courseTitle,
  scheduleName,
  position,
}: WaitlistJoinedEmailProps) {
  return (
    <BaseLayout previewText={`You're #${position} on the waitlist for ${scheduleName}`}>
      <Text style={styles.heading}>You're on the Waitlist!</Text>

      <Text style={styles.text}>
        Hi <strong>{fullName}</strong>,
      </Text>

      <Text style={styles.text}>
        The <strong>{scheduleName}</strong> session for <strong>{courseTitle}</strong> is
        currently full, but we've added you to the waitlist. We'll notify you as soon as
        a seat becomes available.
      </Text>

      <Section style={styles.detailsBox}>
        <Text style={styles.detailsTitle}>Waitlist Details</Text>
        <Text style={styles.detailRow}>
          <strong>Course:</strong> {courseTitle}
        </Text>
        <Text style={styles.detailRow}>
          <strong>Session:</strong> {scheduleName}
        </Text>
        <Text style={styles.detailRow}>
          <strong>Your Position:</strong> #{position}
        </Text>
      </Section>

      <Text style={styles.text}>
        We'll send you an email the moment a seat opens up. You'll have 48 hours to
        confirm your enrollment before the seat is offered to the next person on the
        waitlist.
      </Text>

      <Text style={styles.text}>
        Thank you for your patience!
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
  text: {
    fontSize: "15px",
    lineHeight: "1.6",
    color: "#374151",
    margin: "0 0 12px" as const,
  },
  detailsBox: {
    backgroundColor: "#f0f9ff",
    borderLeft: "4px solid #0ea5e9",
    borderRadius: "4px",
    padding: "16px 20px",
    margin: "20px 0",
  },
  detailsTitle: {
    fontSize: "13px",
    fontWeight: "bold" as const,
    color: "#0369a1",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    margin: "0 0 12px" as const,
  },
  detailRow: {
    fontSize: "14px",
    color: "#374151",
    margin: "0 0 6px" as const,
  },
} as const;
