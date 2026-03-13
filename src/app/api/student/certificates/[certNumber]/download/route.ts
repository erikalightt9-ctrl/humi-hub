import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getCertificateByNumber } from "@/lib/repositories/certificate.repository";
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import React from "react";

const styles = StyleSheet.create({
  page: { padding: 60, backgroundColor: "#fff", fontFamily: "Helvetica" },
  border: { border: "3px solid #1d4ed8", padding: 40, flex: 1 },
  title: { fontSize: 36, color: "#1d4ed8", textAlign: "center", marginBottom: 8, fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 14, color: "#6b7280", textAlign: "center", marginBottom: 40 },
  label: { fontSize: 12, color: "#6b7280", textAlign: "center", marginBottom: 8 },
  name: { fontSize: 28, color: "#111827", textAlign: "center", marginBottom: 4, fontFamily: "Helvetica-Bold" },
  course: { fontSize: 18, color: "#374151", textAlign: "center", marginBottom: 40 },
  footer: { fontSize: 10, color: "#9ca3af", textAlign: "center", marginTop: 40 },
  certNum: { fontSize: 10, color: "#9ca3af", textAlign: "center" },
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ certNumber: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id || token.role !== "student") {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }
    const { certNumber } = await params;
    const cert = await getCertificateByNumber(certNumber);
    if (!cert) {
      return NextResponse.json({ success: false, data: null, error: "Certificate not found" }, { status: 404 });
    }

    const issuedDate = cert.issuedAt.toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    });

    const doc = React.createElement(Document, null,
      React.createElement(Page, { size: "A4", orientation: "landscape", style: styles.page },
        React.createElement(View, { style: styles.border },
          React.createElement(Text, { style: styles.title }, "Certificate of Completion"),
          React.createElement(Text, { style: styles.subtitle }, "HUMI Training Center"),
          React.createElement(Text, { style: styles.label }, "This certifies that"),
          React.createElement(Text, { style: styles.name }, cert.student.name),
          React.createElement(Text, { style: styles.label }, "has successfully completed"),
          React.createElement(Text, { style: styles.course }, cert.course.title),
          React.createElement(Text, { style: styles.footer }, `Issued on ${issuedDate}`),
          React.createElement(Text, { style: styles.certNum }, `Certificate No: ${cert.certNumber}`)
        )
      )
    );

    const buffer = await renderToBuffer(doc);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="certificate-${cert.certNumber}.pdf"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (err) {
    console.error("[GET /api/student/certificates/[certNumber]/download]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
