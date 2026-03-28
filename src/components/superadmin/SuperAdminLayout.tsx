"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  BarChart3,
  Settings,
  Shield,
  LogOut,
  Menu,
  X,
  ToggleLeft,
  DollarSign,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/superadmin",              label: "Dashboard",       icon: LayoutDashboard, exact: true },
  { href: "/superadmin/tenants",      label: "Tenants",         icon: Building2 },
  { href: "/superadmin/analytics",    label: "Analytics",       icon: BarChart3 },
  { href: "/superadmin/revenue",      label: "Revenue",         icon: DollarSign },
  { href: "/superadmin/feature-flags",label: "Feature Flags",   icon: ToggleLeft },
  { href: "/superadmin/settings",     label: "Platform Settings", icon: Settings },
];

interface SuperAdminLayoutProps {
  readonly children: React.ReactNode;
}

export function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-ds-bg flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-56 bg-ds-surface text-ds-text flex flex-col
          transition-transform duration-200
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-ds-border">
          <div className="h-8 w-8 rounded-xl bg-violet-600 flex items-center justify-center shrink-0">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-ds-text leading-none">HUMI</p>
            <p className="text-[10px] text-ds-muted mt-0.5">Super Admin</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive(href, exact)
                  ? "bg-violet-600 text-white"
                  : "text-ds-muted hover:bg-ds-card hover:text-ds-text"
              }`}
              onClick={() => setMobileOpen(false)}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-ds-border">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-ds-muted hover:text-ds-text hover:bg-ds-card"
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
        <header className="sticky top-0 z-20 bg-ds-surface border-b border-ds-border px-4 py-3 flex items-center gap-3">
          <button
            className="lg:hidden p-1.5 rounded-xl text-ds-muted hover:bg-ds-card"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-violet-400" />
            <span className="text-sm font-semibold text-ds-text">Platform Administration</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
