import { Text, Section, Button } from "@react-email/components";
import { BaseLayout } from "./base-layout";

interface TicketCreatedEmailProps {
  readonly referenceNo: string;
  readonly subject: string;
  readonly priority: string;
  readonly category: string;
  readonly submitterName: string;
  readonly submitterType: string;
  readonly adminName: string;
  readonly ticketUrl: string;
}

export function TicketCreatedEmail({
  referenceNo,
  subject,
  priority,
  category,
  submitterName,
  submitterType,
  adminName,
  ticketUrl,
}: TicketCreatedEmailProps) {
  return (
    <BaseLayout
      previewText={`New ${priority} ticket: ${subject}`}
    >
      <Text style={styles.greeting}>Hi {adminName},</Text>
      <Text style={styles.body}>
        A new support ticket has been submitted and requires your attention.
      </Text>

      <Section style={styles.card}>
        <Text style={styles.refNo}>{referenceNo}</Text>
        <Text style={styles.subject}>{subject}</Text>
        <table style={styles.table}>
          <tbody>
            <tr>
              <td style={styles.label}>Priority</td>
              <td style={styles.value}>{priority}</td>
            </tr>
            <tr>
              <td style={styles.label}>Category</td>
              <td style={styles.value}>{category}</td>
            </tr>
            <tr>
              <td style={styles.label}>Submitted by</td>
              <td style={styles.value}>{submitterName} ({submitterType})</td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Section style={{ textAlign: "center" as const, marginTop: "24px" }}>
        <Button href={ticketUrl} style={styles.button}>
          View Ticket
        </Button>
      </Section>
    </BaseLayout>
  );
}

const styles = {
  greeting: { fontSize: "16px", color: "#111827", margin: "0 0 12px" as const },
  body: { fontSize: "15px", color: "#374151", margin: "0 0 20px" as const },
  card: {
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    padding: "20px",
    border: "1px solid #e5e7eb",
  },
  refNo: { fontSize: "12px", color: "#6b7280", fontFamily: "monospace", margin: "0 0 4px" as const },
  subject: { fontSize: "16px", fontWeight: "600" as const, color: "#111827", margin: "0 0 16px" as const },
  table: { width: "100%", borderCollapse: "collapse" as const },
  label: { fontSize: "13px", color: "#6b7280", padding: "4px 12px 4px 0", width: "120px" },
  value: { fontSize: "13px", color: "#111827", padding: "4px 0" },
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
