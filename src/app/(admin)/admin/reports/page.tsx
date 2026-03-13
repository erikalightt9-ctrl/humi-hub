import type { Metadata } from "next";
import { FileBarChart, Download } from "lucide-react";

export const metadata: Metadata = { title: "Reports | HUMI Admin" };

export default function ReportsPage() {
  const reportTypes = [
    {
      title: "Enrollment Report",
      description: "Download a CSV of all enrollment data including status, course, and dates.",
      href: "/api/admin/export",
      available: true,
    },
    {
      title: "Attendance Report",
      description: "Daily and weekly attendance summaries with clock-in/out times.",
      href: "#",
      available: false,
    },
    {
      title: "Grade Report",
      description: "Student quiz scores and assignment grades across all courses.",
      href: "#",
      available: false,
    },
    {
      title: "Revenue Report",
      description: "Payment totals by course, method, and date range.",
      href: "#",
      available: false,
    },
  ];

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500 text-sm mt-1">
          Generate and download reports
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportTypes.map((report) => (
          <div
            key={report.title}
            className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col justify-between"
          >
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <FileBarChart className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">{report.title}</h3>
              </div>
              <p className="text-sm text-gray-500">{report.description}</p>
            </div>
            {report.available ? (
              <a
                href={report.href}
                className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                <Download className="h-4 w-4" />
                Download CSV
              </a>
            ) : (
              <span className="text-xs text-gray-400 font-medium">Coming soon</span>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
