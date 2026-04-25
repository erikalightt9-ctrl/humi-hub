"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Dashboard",           href: "/admin/hr" },
  { label: "Employees",           href: "/admin/hr/employees" },
  { label: "Payroll",             href: "/admin/hr/payroll" },
  { label: "🔴 Live",            href: "/admin/hr/live" },
  { label: "Attendance",          href: "/admin/hr/attendance" },
  { label: "Leave Requests",      href: "/admin/hr/leave" },
  { label: "Gov. Contrib. Rules", href: "/admin/hr/gov-contrib-rules" },
  { label: "⚙ Settings",         href: "/admin/hr/settings" },
];

export default function HrLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin/hr") return pathname === "/admin/hr";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="bg-white border-b border-slate-200">
        <div className="px-6">
          <nav className="flex gap-1 overflow-x-auto" aria-label="HR navigation">
            {TABS.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={`
                  px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                  ${isActive(tab.href)
                    ? "border-indigo-600 text-indigo-700"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                  }
                `}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      <div className="flex-1 bg-slate-50">{children}</div>
    </div>
  );
}
