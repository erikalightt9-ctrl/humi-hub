"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Users, ClipboardList, CalendarClock } from "lucide-react";
import { ActiveStudentsTable } from "./ActiveStudentsTable";
import { EnrolleesTable } from "./EnrolleesTable";
import { FilterBar } from "./FilterBar";
import { Pagination } from "./Pagination";
import { AttendanceLiveTable } from "./AttendanceLiveTable";
import type { EnrollmentWithCourse } from "@/lib/repositories/enrollment.repository";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type TabKey = "active" | "enrollments" | "attendance";

interface CourseOption {
  readonly id: string;
  readonly title: string;
}

interface EnrollmentPaginated {
  readonly data: EnrollmentWithCourse[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}

interface StudentManagementTabsProps {
  readonly courses: ReadonlyArray<CourseOption>;
  readonly enrollments: EnrollmentPaginated;
}

/* ------------------------------------------------------------------ */
/*  Tab definitions                                                    */
/* ------------------------------------------------------------------ */

const TABS: ReadonlyArray<{
  readonly key: TabKey;
  readonly label: string;
  readonly icon: typeof Users;
}> = [
  { key: "active", label: "Active Students", icon: Users },
  { key: "enrollments", label: "Enrollments", icon: ClipboardList },
  { key: "attendance", label: "Attendance", icon: CalendarClock },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function StudentManagementTabs({
  courses,
  enrollments,
}: StudentManagementTabsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const activeTab = (searchParams.get("tab") as TabKey) ?? "active";

  function switchTab(tab: TabKey) {
    const params = new URLSearchParams();
    params.set("tab", tab);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <>
      {/* Tab bar */}
      <div className="border-b border-ds-border mb-6">
        <nav className="-mb-px flex gap-6" aria-label="Student management tabs">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => switchTab(tab.key)}
                className={`flex items-center gap-2 pb-3 border-b-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-ds-primary text-ds-primary"
                    : "border-transparent text-ds-muted hover:text-ds-text hover:border-ds-border"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === "active" && (
        <ActiveStudentsTable courses={[...courses]} />
      )}

      {activeTab === "enrollments" && (
        <>
          <FilterBar />
          <EnrolleesTable enrollments={enrollments.data} />
          {enrollments.totalPages > 1 && (
            <Pagination
              page={enrollments.page}
              totalPages={enrollments.totalPages}
              total={enrollments.total}
              limit={enrollments.limit}
            />
          )}
        </>
      )}

      {activeTab === "attendance" && <AttendanceLiveTable />}
    </>
  );
}
