"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  DollarSign,
  BarChart3,
  ToggleLeft,
  Settings,
  LifeBuoy,
  LogOut,
  Menu,
  X,
  ArrowLeft,
  Bell,
  Shield,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/superadmin",                label: "Overview",        icon: LayoutDashboard, exact: true },
  { href: "/superadmin/tenants",        label: "Tenants",         icon: Building2 },
  { href: "/superadmin/subscriptions",  label: "Subscriptions",   icon: CreditCard },
  { href: "/superadmin/revenue",        label: "Revenue",         icon: DollarSign },
  { href: "/superadmin/analytics",      label: "Analytics",       icon: BarChart3 },
  { href: "/superadmin/feature-flags",  label: "Feature Control", icon: ToggleLeft },
  { href: "/superadmin/settings",       label: "Settings",        icon: Settings },
  { href: "/superadmin/support",        label: "Support",         icon: LifeBuoy },
];

const PAGE_LABELS: Record<string, string> = {
  "/superadmin":                "Overview",
  "/superadmin/tenants":        "Tenants",
  "/superadmin/subscriptions":  "Subscriptions",
  "/superadmin/revenue":        "Revenue",
  "/superadmin/analytics":      "Analytics",
  "/superadmin/feature-flags":  "Feature Control",
  "/superadmin/settings":       "Settings",
  "/superadmin/support":        "Support",
};

function getBreadcrumb(pathname: string): string {
  // Exact match first
  if (PAGE_LABELS[pathname]) return PAGE_LABELS[pathname];
  // Prefix match
  const match = Object.keys(PAGE_LABELS)
    .filter((k) => k !== "/superadmin" && pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0];
  return match ? PAGE_LABELS[match] : "Super Admin";
}

interface SuperAdminLayoutProps {
  readonly children: React.ReactNode;
}

export function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const breadcrumb = getBreadcrumb(pathname);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-56 bg-[#1E3A8A] text-white flex flex-col
          transition-transform duration-200
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/10">
          <div className="h-8 w-8 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">HUMI Hub</p>
            <p className="text-[10px] text-blue-200 mt-0.5">Super Admin</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="px-3 mb-2 text-[10px] font-semibold text-blue-300 uppercase tracking-widest">
            Platform
          </p>
          <div className="space-y-0.5">
            {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
              const active = isActive(href, exact);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                    ${active
                      ? "bg-white/10 text-white -ml-px pl-[11px] pr-3 border-l-2 border-blue-400"
                      : "px-3 text-white/80 hover:bg-white/10 hover:text-white"
                    }`}
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-white/10 space-y-1">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            Back to Admin
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-white/80 hover:text-white hover:bg-white/10"
            onClick={() => signOut({ callbackUrl: "/portal" })}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main area */}
      <div className="flex-1 lg:ml-56 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <span>Super Admin</span>
              <span className="text-slate-300">/</span>
              <span className="font-semibold text-slate-900">{breadcrumb}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
              <Bell className="h-4 w-4" />
            </button>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
              <Shield className="h-3 w-3" />
              Super Admin
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
