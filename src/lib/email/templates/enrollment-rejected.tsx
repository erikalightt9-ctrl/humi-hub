import { Text, Section, Link } from "@react-email/components";
import { BaseLayout } from "./base-layout";

interface EnrollmentRejectedEmailProps {
  readonly name: string;
  readonly email: string;
  readonly courseTitle: string;
  readonly feedback?: string;
  readonly contactEmail: string;
}

export function EnrollmentRejectedEmail({
  name,
  courseTitle,
  feedback,
  contactEmail,
}: EnrollmentRejectedEmailProps) {
  return (
    <BaseLayout previewText={`Application update for ${courseTitle}`}>
      <Text style={styles.heading}>Application Update</Text>

      <Text style={styles.text}>
        Hi <strong>{name}</strong>,
      </Text>

      <Text style={styles.text}>
        Thank you for your interest in <strong>{courseTitle}</strong>. After
        careful review, we are unable to approve your application at this time.
      </Text>

      {feedback && (
        <Section style={styles.feedbackBox}>
          <Text style={styles.feedbackTitle}>Reviewer Feedback</Text>
          <Text style={styles.feedbackText}>{feedback}</Text>
        </Section>
      )}

      <Text style={styles.text}>
        This does not mean you cannot apply again in the future. We encourage
        you to address any feedback and resubmit your application.
      </Text>

      {contactEmail && (
        <Text style={styles.text}>
          If you have questions, feel free to contact us at{" "}
          <Link href={`mailto:${contactEmail}`} style={styles.link}>
            {contactEmail}
          </Link>
          .
        </Text>
      )}

      <Text style={styles.textMuted}>
        We appreciate your interest in HUMI Hub and wish you the best.
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
  link: {
    color: "#1d4ed8",
    textDecoration: "underline",
  },
  feedbackBox: {
    backgroundColor: "#fefce8",
    border: "1px solid #fde68a",
    borderRadius: "6px",
    padding: "16px 20px",
    margin: "20px 0" as const,
  },
  feedbackTitle: {
    fontSize: "14px",
    fontWeight: "bold" as const,
    color: "#92400e",
    margin: "0 0 8px" as const,
  },
  feedbackText: {
    fontSize: "14px",
    color: "#78350f",
    margin: "0" as const,
    lineHeight: "1.5",
  },
} as const;
