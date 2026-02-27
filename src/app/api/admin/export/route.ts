import { NextResponse } from "next/server";
import { getAllEnrollmentsForExport } from "@/lib/repositories/enrollment.repository";

function escapeCsvField(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsvRow(fields: (string | null | undefined)[]): string {
  return fields.map(escapeCsvField).join(",");
}

export async function GET() {
  try {
    const enrollments = await getAllEnrollmentsForExport();

    const headers = [
      "ID",
      "Status",
      "Full Name",
      "Date of Birth",
      "Email",
      "Contact Number",
      "Address",
      "Educational Background",
      "Work Experience",
      "Employment Status",
      "Technical Skills",
      "Tools Familiarity",
      "Why Enroll",
      "Course",
      "IP Address",
      "Submitted At",
      "Status Updated At",
    ];

    const rows = enrollments.map((e) =>
      toCsvRow([
        e.id,
        e.status,
        e.fullName,
        e.dateOfBirth.toISOString().split("T")[0],
        e.email,
        e.contactNumber,
        e.address,
        e.educationalBackground,
        e.workExperience,
        e.employmentStatus,
        e.technicalSkills.join("; "),
        e.toolsFamiliarity.join("; "),
        e.whyEnroll,
        e.course.title,
        e.ipAddress,
        e.createdAt.toISOString(),
        e.statusUpdatedAt?.toISOString(),
      ])
    );

    const csv = [toCsvRow(headers), ...rows].join("\n");

    const filename = `enrollments-${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/export]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
