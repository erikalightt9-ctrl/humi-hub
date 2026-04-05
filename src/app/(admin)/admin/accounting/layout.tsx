"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Dashboard", href: "/admin/accounting" },
  { label: "Accounts", href: "/admin/accounting/accounts" },
  { label: "Transactions", href: "/admin/accounting/transactions" },
  { label: "Invoices", href: "/admin/accounting/invoices" },
  { label: "Expenses", href: "/admin/accounting/expenses" },
  { label: "Bank", href: "/admin/accounting/bank" },
  { label: "Reports", href: "/admin/accounting/reports" },
  { label: "Audit & Forensic", href: "/admin/accounting/audit" },
];

export default function AccountingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin/accounting") {
      return pathname === "/admin/accounting";
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="bg-white border-b border-slate-200">
        <div className="px-6">
          <nav className="flex gap-1 overflow-x-auto" aria-label="Accounting navigation">
            {TABS.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={`
                  px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                  ${
                    isActive(tab.href)
                      ? "border-emerald-600 text-emerald-700"
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
