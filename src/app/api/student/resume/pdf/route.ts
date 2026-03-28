import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
  Image,
  Font,
} from "@react-pdf/renderer";
import React from "react";

// Register fonts for better typography
Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2" },
  ],
});

interface WorkEntry {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  year: string;
}

interface CertEntry {
  title: string;
  certNumber: string;
  issuedAt: string;
}

interface ResumePayload {
  name: string;
  email: string;
  phone: string;
  location: string;
  headline: string;
  summary: string;
  skills: string[];
  workExperience: WorkEntry[];
  education: EducationEntry[];
  certifications: CertEntry[];
  photoUrl?: string | null;
  templateId: string;
  styleColor: string;
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ success: false, data: null, error }, { status });
}

function buildStyles(color: string) {
  return StyleSheet.create({
    page: { fontFamily: "Helvetica", fontSize: 10, padding: 40, color: "#1f2937" },
    header: { marginBottom: 16, borderBottomWidth: 2, borderBottomColor: color, paddingBottom: 12 },
    headerRow: { flexDirection: "row", alignItems: "flex-start", gap: 16 },
    photo: { width: 64, height: 64, borderRadius: 32, objectFit: "cover" },
    headerInfo: { flex: 1 },
    name: { fontSize: 22, fontFamily: "Helvetica-Bold", color, marginBottom: 2 },
    headline: { fontSize: 11, color: "#6b7280", marginBottom: 6 },
    contactRow: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    contact: { fontSize: 9, color: "#6b7280" },
    section: { marginBottom: 14 },
    sectionTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color, textTransform: "uppercase", letterSpacing: 1, borderBottomWidth: 1, borderBottomColor: color, paddingBottom: 3, marginBottom: 8 },
    entryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
    entryTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#111827" },
    entrySubtitle: { fontSize: 9, color: "#6b7280" },
    entryDate: { fontSize: 9, color: "#9ca3af" },
    entryDesc: { fontSize: 9, color: "#4b5563", marginTop: 3, lineHeight: 1.5 },
    skillsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    skill: { fontSize: 8, color: "#374151", backgroundColor: "#f3f4f6", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
    summaryText: { fontSize: 10, color: "#4b5563", lineHeight: 1.6 },
  });
}

function ResumePDF({ data }: { data: ResumePayload }) {
  const styles = buildStyles(data.styleColor);

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      // Header
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(
          View,
          { style: styles.headerRow },
          data.photoUrl
            ? React.createElement(Image, { src: data.photoUrl, style: styles.photo })
            : null,
          React.createElement(
            View,
            { style: styles.headerInfo },
            React.createElement(Text, { style: styles.name }, data.name || "Your Name"),
            data.headline
              ? React.createElement(Text, { style: styles.headline }, data.headline)
              : null,
            React.createElement(
              View,
              { style: styles.contactRow },
              data.email ? React.createElement(Text, { style: styles.contact }, `✉ ${data.email}`) : null,
              data.phone ? React.createElement(Text, { style: styles.contact }, `✆ ${data.phone}`) : null,
              data.location ? React.createElement(Text, { style: styles.contact }, `⌖ ${data.location}`) : null
            )
          )
        )
      ),
      // Summary
      data.summary
        ? React.createElement(
            View,
            { style: styles.section },
            React.createElement(Text, { style: styles.sectionTitle }, "Professional Summary"),
            React.createElement(Text, { style: styles.summaryText }, data.summary)
          )
        : null,
      // Work Experience
      data.workExperience.length > 0
        ? React.createElement(
            View,
            { style: styles.section },
            React.createElement(Text, { style: styles.sectionTitle }, "Work Experience"),
            ...data.workExperience.map((w) =>
              React.createElement(
                View,
                { key: w.id, style: { marginBottom: 8 } },
                React.createElement(
                  View,
                  { style: styles.entryRow },
                  React.createElement(Text, { style: styles.entryTitle }, w.position || "Position"),
                  React.createElement(Text, { style: styles.entryDate }, `${w.startDate}${w.endDate ? ` – ${w.endDate}` : ""}`)
                ),
                React.createElement(Text, { style: styles.entrySubtitle }, w.company || "Company"),
                w.description ? React.createElement(Text, { style: styles.entryDesc }, w.description) : null
              )
            )
          )
        : null,
      // Education
      data.education.length > 0
        ? React.createElement(
            View,
            { style: styles.section },
            React.createElement(Text, { style: styles.sectionTitle }, "Education"),
            ...data.education.map((e) =>
              React.createElement(
                View,
                { key: e.id, style: { marginBottom: 6 } },
                React.createElement(
                  View,
                  { style: styles.entryRow },
                  React.createElement(Text, { style: styles.entryTitle }, e.degree || "Degree"),
                  React.createElement(Text, { style: styles.entryDate }, e.year)
                ),
                React.createElement(Text, { style: styles.entrySubtitle }, e.institution || "Institution")
              )
            )
          )
        : null,
      // Skills
      data.skills.length > 0
        ? React.createElement(
            View,
            { style: styles.section },
            React.createElement(Text, { style: styles.sectionTitle }, "Skills"),
            React.createElement(
              View,
              { style: styles.skillsWrap },
              ...data.skills.map((s) =>
                React.createElement(Text, { key: s, style: styles.skill }, s)
              )
            )
          )
        : null,
      // Certifications
      data.certifications.length > 0
        ? React.createElement(
            View,
            { style: styles.section },
            React.createElement(Text, { style: styles.sectionTitle }, "Certifications"),
            ...data.certifications.map((c) =>
              React.createElement(
                View,
                { key: c.certNumber, style: styles.entryRow },
                React.createElement(Text, { style: styles.entryTitle }, c.title),
                React.createElement(Text, { style: styles.entryDate },
                  new Date(c.issuedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                )
              )
            )
          )
        : null
    )
  );
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const studentId = (session?.user as { id: string } | undefined)?.id;
  if (!studentId) return jsonError("Unauthorized", 401);

  try {
    const body = (await request.json()) as ResumePayload;

    const pdfBuffer = await renderToBuffer(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      React.createElement(ResumePDF, { data: body }) as any
    );

    const safeName = (body.name || "resume").replace(/[^a-z0-9]/gi, "_").toLowerCase();

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeName}_resume.pdf"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (err) {
    console.error("[POST /api/student/resume/pdf]", err);
    return jsonError("Failed to generate PDF", 500);
  }
}
