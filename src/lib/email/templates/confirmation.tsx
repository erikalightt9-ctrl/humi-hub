import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Row,
  Column,
} from "@react-email/components";
import * as React from "react";

interface ConfirmationEmailProps {
  fullName: string;
  courseTitle: string;
  enrollmentId: string;
  submittedAt: string;
}

export function ConfirmationEmail({
  fullName,
  courseTitle,
  enrollmentId,
  submittedAt,
}: ConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your enrollment application has been received — {courseTitle}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Heading style={logoStyle}>VA Training Center</Heading>
          </Section>

          {/* Content */}
          <Section style={contentStyle}>
            <Heading as="h2" style={h2Style}>
              Application Received!
            </Heading>

            <Text style={textStyle}>
              Hi <strong>{fullName}</strong>,
            </Text>

            <Text style={textStyle}>
              Thank you for applying to the <strong>{courseTitle}</strong> program at VA Training
              Center. We have successfully received your enrollment application.
            </Text>

            <Section style={detailBoxStyle}>
              <Heading as="h3" style={h3Style}>
                Application Details
              </Heading>
              <Row>
                <Column>
                  <Text style={detailLabelStyle}>Course</Text>
                  <Text style={detailValueStyle}>{courseTitle}</Text>
                </Column>
              </Row>
              <Row>
                <Column>
                  <Text style={detailLabelStyle}>Reference ID</Text>
                  <Text style={detailValueStyle}>{enrollmentId}</Text>
                </Column>
              </Row>
              <Row>
                <Column>
                  <Text style={detailLabelStyle}>Submitted</Text>
                  <Text style={detailValueStyle}>{submittedAt}</Text>
                </Column>
              </Row>
              <Row>
                <Column>
                  <Text style={detailLabelStyle}>Status</Text>
                  <Text style={{ ...detailValueStyle, color: "#d97706", fontWeight: "bold" }}>
                    Pending Review
                  </Text>
                </Column>
              </Row>
            </Section>

            <Text style={textStyle}>
              Our admissions team will review your application and get back to you within{" "}
              <strong>3–5 business days</strong>. You will receive another email once a decision has
              been made.
            </Text>

            <Text style={textStyle}>
              If you have any questions in the meantime, please don&apos;t hesitate to reach out to
              us at{" "}
              <a href={`mailto:${process.env.EMAIL_FROM_ADDRESS}`} style={linkStyle}>
                {process.env.EMAIL_FROM_ADDRESS}
              </a>
              .
            </Text>
          </Section>

          <Hr style={hrStyle} />

          {/* Footer */}
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              © {new Date().getFullYear()} VA Training Center. All rights reserved.
            </Text>
            <Text style={footerTextStyle}>
              You are receiving this email because you submitted an enrollment application on our
              website.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const bodyStyle: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  fontFamily: "'Segoe UI', Arial, sans-serif",
};

const containerStyle: React.CSSProperties = {
  maxWidth: "600px",
  margin: "0 auto",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  overflow: "hidden",
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
};

const headerStyle: React.CSSProperties = {
  backgroundColor: "#1e3a8a",
  padding: "24px 40px",
};

const logoStyle: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0",
};

const contentStyle: React.CSSProperties = {
  padding: "40px",
};

const h2Style: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#111827",
  marginBottom: "16px",
};

const h3Style: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: "bold",
  color: "#374151",
  marginBottom: "12px",
  marginTop: "0",
};

const textStyle: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: "1.6",
  color: "#374151",
  marginBottom: "16px",
};

const detailBoxStyle: React.CSSProperties = {
  backgroundColor: "#f3f4f6",
  borderRadius: "8px",
  padding: "24px",
  marginBottom: "24px",
};

const detailLabelStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: "2px",
  marginTop: "12px",
};

const detailValueStyle: React.CSSProperties = {
  fontSize: "15px",
  color: "#111827",
  fontWeight: "500",
  marginTop: "0",
};

const linkStyle: React.CSSProperties = {
  color: "#1e3a8a",
  textDecoration: "underline",
};

const hrStyle: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "0",
};

const footerStyle: React.CSSProperties = {
  padding: "24px 40px",
  backgroundColor: "#f9fafb",
};

const footerTextStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#9ca3af",
  margin: "4px 0",
};

export default ConfirmationEmail;
