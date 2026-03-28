"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const SEGMENT_LABELS: Record<string, string> = {
  admin: "Admin",
  students: "Students",
  trainers: "Trainers",
  enrollees: "Enrollment",
  payments: "Payments",
  subscriptions: "AI Subscriptions",
  courses: "Courses",
  lessons: "Lessons",
  schedules: "Schedules",
  assignments: "Assignments",
  "job-postings": "Job Listings",
  "job-applications": "Job Applications",
  "student-ranking": "Student Ranking",
  certificates: "Certificates",
  communications: "Contact Messages",
  messages: "Messaging",
  tickets: "Support Tickets",
  "knowledge-base": "Knowledge Base",
  notifications: "Notifications",
  calendar: "Calendar",
  testimonials: "Testimonials",
  analytics: "Analytics",
  "ai-insights": "AI Insights",
  "control-tower": "Control Tower",
  reports: "Reports",
  organizations: "Organizations",
  settings: "Settings",
  profile: "My Profile",
  engagement: "Student Progress",
  attendance: "Attendance",
  placements: "Job Placements",
  "ai-insights-page": "AI Insights",
};

function toLabel(segment: string): string {
  return SEGMENT_LABELS[segment] ?? segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function AdminBreadcrumb() {
  const pathname = usePathname();

  // Split and filter empty segments
  const segments = pathname.split("/").filter(Boolean);

  // Build crumb list: each crumb = { label, href }
  const crumbs = segments.map((seg, i) => ({
    label: toLabel(seg),
    href: "/" + segments.slice(0, i + 1).join("/"),
  }));

  // Only show breadcrumb when deeper than /admin
  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-gray-500">
      <Link href="/admin" className="flex items-center gap-1 hover:text-gray-800 transition-colors">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {crumbs.slice(1).map((crumb, i) => {
        const isLast = i === crumbs.length - 2;
        return (
          <span key={crumb.href} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
            {isLast ? (
              <span className="font-medium text-gray-800">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="hover:text-gray-800 transition-colors">
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
