import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
} from "@react-email/components";
import type { ReactNode } from "react";

interface BaseLayoutProps {
  readonly children: ReactNode;
  readonly previewText?: string;
}

export function BaseLayout({ children, previewText }: BaseLayoutProps) {
  return (
    <Html lang="en">
      <Head />
      {previewText && (
        <Text style={{ display: "none", maxHeight: 0, overflow: "hidden" }}>
          {previewText}
        </Text>
      )}
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={styles.header}>
            <Text style={styles.headerTitle}>HUMI Training Center</Text>
            <Text style={styles.headerSubtitle}>Your Path to a VA Career</Text>
          </Section>

          {/* Content */}
          <Section style={styles.content}>{children}</Section>

          {/* Footer */}
          <Section style={styles.footer}>
            <Hr style={styles.footerHr} />
            <Text style={styles.footerText}>
              HUMI Training Center &bull; Empowering Professional Growth
            </Text>
            <Text style={styles.footerSmall}>
              This is an automated message. Please do not reply directly to this
              email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    backgroundColor: "#f4f4f5",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    margin: "0" as const,
    padding: "20px 0" as const,
  },
  container: {
    maxWidth: "600px",
    margin: "0 auto" as const,
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    overflow: "hidden" as const,
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  },
  header: {
    backgroundColor: "#1d4ed8",
    padding: "32px 24px",
    textAlign: "center" as const,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: "24px",
    fontWeight: "bold" as const,
    margin: "0" as const,
    lineHeight: "1.3",
  },
  headerSubtitle: {
    color: "#bfdbfe",
    fontSize: "14px",
    margin: "8px 0 0" as const,
  },
  content: {
    padding: "32px 24px",
  },
  footer: {
    padding: "0 24px 24px",
  },
  footerHr: {
    borderColor: "#e5e7eb",
    margin: "24px 0",
  },
  footerText: {
    color: "#6b7280",
    fontSize: "13px",
    textAlign: "center" as const,
    margin: "0 0 4px" as const,
  },
  footerSmall: {
    color: "#9ca3af",
    fontSize: "11px",
    textAlign: "center" as const,
    margin: "0" as const,
  },
} as const;
