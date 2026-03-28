"use client";

import { useState } from "react";
import { FileBarChart, Download, Calendar, DollarSign, Users, GraduationCap } from "lucide-react";

interface ReportConfig {
  readonly title: string;
  readonly description: string;
  readonly icon: React.ReactNode;
  readonly endpoint: string;
  readonly supportsDateRange: boolean;
  readonly color: string;
}

const REPORTS: ReadonlyArray<ReportConfig> = [
  {
    title: "Enrollment Report",
    description: "All enrollment data including status, course, trainer tier, and submission dates.",
    icon: <Users className="h-5 w-5 text-blue-600" />,
    endpoint: "/api/admin/export",
    supportsDateRange: false,
    color: "blue",
  },
  {
    title: "Revenue Report",
    description: "Payment totals by course, method, and date range. Includes verified and pending payments.",
    icon: <DollarSign className="h-5 w-5 text-green-600" />,
    endpoint: "/api/admin/export/revenue",
    supportsDateRange: true,
    color: "green",
  },
  {
    title: "Attendance Report",
    description: "Session-by-session attendance across all schedules. Filter by date range.",
    icon: <Calendar className="h-5 w-5 text-purple-600" />,
    endpoint: "/api/admin/export/attendance",
    supportsDateRange: true,
    color: "purple",
  },
  {
    title: "Grade Report",
    description: "Student quiz scores and pass/fail results across all courses.",
    icon: <GraduationCap className="h-5 w-5 text-amber-600" />,
    endpoint: "/api/admin/export/grades",
    supportsDateRange: true,
    color: "amber",
  },
];

function buildUrl(endpoint: string, from: string, to: string): string {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const query = params.toString();
  return query ? `${endpoint}?${query}` : endpoint;
}

export function ReportsPageClient() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500 text-sm mt-1">
          Generate and download data exports
        </p>
      </div>

      {/* Global date range filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          Date Range Filter
          <span className="text-gray-400 font-normal">(applies to Revenue, Attendance, and Grade reports)</span>
        </h2>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {(from || to) && (
            <button
              onClick={() => { setFrom(""); setTo(""); }}
              className="text-xs text-gray-500 hover:text-gray-700 underline pb-2"
            >
              Clear filter
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REPORTS.map((report) => (
          <div
            key={report.title}
            className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col justify-between"
          >
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <FileBarChart className="h-5 w-5 text-gray-400" />
                {report.icon}
                <h3 className="font-semibold text-gray-900">{report.title}</h3>
              </div>
              <p className="text-sm text-gray-500">{report.description}</p>
              {report.supportsDateRange && (from || to) && (
                <p className="text-xs text-blue-600 mt-2">
                  Filtered: {from || "all time"} → {to || "now"}
                </p>
              )}
            </div>
            <a
              href={
                report.supportsDateRange
                  ? buildUrl(report.endpoint, from, to)
                  : report.endpoint
              }
              className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
              download
            >
              <Download className="h-4 w-4" />
              Download CSV
            </a>
          </div>
        ))}
      </div>
    </>
  );
}
