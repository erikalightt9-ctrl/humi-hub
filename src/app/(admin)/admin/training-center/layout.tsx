"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  Users,
  Award,
} from "lucide-react";

const TABS = [
  { label: "Overview",        href: "/admin/training-center",                icon: LayoutDashboard, exact: true },
  { label: "Programs",        href: "/admin/training-center/programs",       icon: BookOpen },
  { label: "Schedules",       href: "/admin/training-center/schedules",      icon: CalendarDays },
  { label: "Participants",    href: "/admin/training-center/participants",    icon: Users },
  { label: "Certifications",  href: "/admin/training-center/certifications", icon: Award },
];

export default function TrainingCenterLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="flex flex-col min-h-full">
      {/* Header bar */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="px-4 sm:px-6">
          {/* Section title */}
          <div className="flex items-center gap-2.5 pt-4 pb-2">
            <div className="h-8 w-8 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 leading-none">Training Center</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Courses · Schedules · Attendance · Certifications
              </p>
            </div>
          </div>

          {/* Tab bar */}
          <nav className="flex gap-0.5 overflow-x-auto scrollbar-none pb-0" aria-label="Training Center">
            {TABS.map((tab) => {
              const active = isActive(tab.href, tab.exact);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`
                    flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap
                    border-b-2 transition-all duration-150 shrink-0
                    ${active
                      ? "border-indigo-600 text-indigo-700 bg-indigo-50/60"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }
                  `}
                >
                  <tab.icon className={`h-3.5 w-3.5 shrink-0 ${active ? "text-indigo-600" : "text-slate-400"}`} />
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="flex-1 bg-slate-50 p-4 sm:p-6">{children}</div>
    </div>
  );
}
