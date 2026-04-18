"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Archive,
  Fuel,
  Wrench,
  Sofa,
  ShoppingBag,
  Pill,
  Car,
  ClipboardList,
  Truck,
  PackageSearch,
} from "lucide-react";

const TABS = [
  { label: "Overview",                href: "/admin/admin",                  icon: LayoutDashboard },
  { label: "Inventory",               href: "/admin/admin/stockroom",        icon: PackageSearch },
  { label: "Inventory",               href: "/admin/admin/assets",           icon: Archive },
  { label: "Fuel Requests",           href: "/admin/admin/fuel-requests",    icon: Fuel },
  { label: "Maintenance Supplies",    href: "/admin/admin/maintenance",      icon: Wrench },
  { label: "Appliances & Furniture",  href: "/admin/admin/equipment",        icon: Sofa },
  { label: "Office Supplies",         href: "/admin/admin/pantry",           icon: ShoppingBag },
  { label: "Medicine",                href: "/admin/admin/medicine",         icon: Pill },
  { label: "Vehicle & Fuel",          href: "/admin/admin/car-maintenance",  icon: Car },
  { label: "Repair Logs",             href: "/admin/admin/repair-logs",      icon: ClipboardList },
  { label: "Suppliers",               href: "/admin/admin/suppliers",        icon: Truck },
];

export default function AdminDeptLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin/admin") return pathname === "/admin/admin";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Tab bar */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="px-4 sm:px-6">
          {/* Section header */}
          <div className="flex items-center gap-2 pt-4 pb-2">
            <div className="h-7 w-7 rounded-lg bg-teal-600 flex items-center justify-center">
              <ShoppingBag className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 leading-none">Office Admin</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">Assets, supplies, and operations management</p>
            </div>
          </div>

          {/* Scrollable tab nav */}
          <nav
            className="flex gap-0.5 overflow-x-auto pb-0 scrollbar-none"
            aria-label="Office Admin navigation"
          >
            {TABS.map((tab) => {
              const active = isActive(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`
                    flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap
                    border-b-2 transition-all duration-150 shrink-0
                    ${active
                      ? "border-teal-600 text-teal-700 bg-teal-50/60"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }
                  `}
                >
                  <tab.icon className={`h-3.5 w-3.5 shrink-0 ${active ? "text-teal-600" : "text-slate-400"}`} />
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="flex-1 bg-slate-50">{children}</div>
    </div>
  );
}
