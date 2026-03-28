import { Text, Section, Button } from "@react-email/components";
import { BaseLayout } from "./base-layout";

interface TicketReplyEmailProps {
  readonly referenceNo: string;
  readonly subject: string;
  readonly recipientName: string;
  readonly responderName: string;
  readonly replyPreview: string;
  readonly ticketUrl: string;
}

export function TicketReplyEmail({
  referenceNo,
  subject,
  recipientName,
  responderName,
  replyPreview,
  ticketUrl,
}: TicketReplyEmailProps) {
  return (
    <BaseLayout
      previewText={`${responderName} replied to your ticket: ${subject}`}
    >
      <Text style={styles.greeting}>Hi {recipientName},</Text>
      <Text style={styles.body}>
        <strong>{responderName}</strong> from the support team has responded to your ticket.
      </Text>

      <Section style={styles.card}>
        <Text style={styles.refNo}>{referenceNo}</Text>
        <Text style={styles.subject}>{subject}</Text>
        <Text style={styles.preview}>{replyPreview}</Text>
      </Section>

      <Text style={styles.hint}>
        Log in to view the full response and continue the conversation.
      </Text>

      <Section style={{ textAlign: "center" as const, marginTop: "24px" }}>
        <Button href={ticketUrl} style={styles.button}>
          View Response
        </Button>
      </Section>
    </BaseLayout>
  );
}

const styles = {
  greeting: { fontSize: "16px", color: "#111827", margin: "0 0 12px" as const },
  body: { fontSize: "15px", color: "#374151", margin: "0 0 20px" as const },
  card: {
    backgroundColor: "#eff6ff",
    borderRadius: "8px",
    padding: "20px",
    border: "1px solid #bfdbfe",
  },
  refNo: { fontSize: "12px", color: "#6b7280", fontFamily: "monospace", margin: "0 0 4px" as const },
  subject: { fontSize: "15px", fontWeight: "600" as const, color: "#1e40af", margin: "0 0 12px" as const },
  preview: {
    fontSize: "14px",
    color: "#374151",
    margin: "0",
    fontStyle: "italic" as const,
    borderLeft: "3px solid #93c5fd",
    paddingLeft: "12px",
  },
  hint: { fontSize: "13px", color: "#6b7280", margin: "16px 0 0" as const },
  button: {
    backgroundColor: "#1d4ed8",
    color: "#ffffff",
    padding: "12px 28px",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "600" as const,
    textDecoration: "none" as const,
    display: "inline-block" as const,
  },
} as const;
