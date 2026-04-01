"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  BarChart3,
  Settings,
  Shield,
  LogOut,
  Menu,
  X,
  BookOpen,
  Users,
  UserCog,
  DollarSign,
  Zap,
  ChevronRight,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

interface Tenant {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
}

interface UnifiedAdminLayoutProps {
  readonly children: React.ReactNode;
}

const PLATFORM_NAV = [
  { href: "/superadmin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/superadmin/tenants", label: "Tenants", icon: Building2 },
  { href: "/superadmin/humi-admins", label: "HUMI Admins", icon: Shield },
  { href: "/superadmin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/superadmin/settings", label: "Platform Settings", icon: Settings },
] as const;

function buildTenantNav(tenantId: string) {
  return [
    { href: `/superadmin/view/${tenantId}/dashboard`, label: "Dashboard", icon: LayoutDashboard },
    { href: `/superadmin/view/${tenantId}/courses`, label: "Courses", icon: BookOpen },
    { href: `/superadmin/view/${tenantId}/students`, label: "Students", icon: Users },
    { href: `/superadmin/view/${tenantId}/trainers`, label: "Trainers", icon: UserCog },
    { href: `/superadmin/view/${tenantId}/revenue`, label: "Revenue", icon: DollarSign },
  ];
}

export function UnifiedAdminLayout({ children }: UnifiedAdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);

  const isTenantMode = pathname.startsWith("/superadmin/view/");
  const tenantId = isTenantMode ? pathname.split("/")[3] : null;
  const currentTenant = tenants.find((t) => t.id === tenantId) ?? null;

  useEffect(() => {
    fetch("/api/superadmin/tenants")
      .then((r) => r.json())
      .then((d: { success: boolean; data: Tenant[] }) => {
        if (d.success) setTenants(d.data);
      })
      .catch(() => {});
  }, []);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const navItems = isTenantMode && tenantId ? buildTenantNav(tenantId) : PLATFORM_NAV;

  const sidebarBg = isTenantMode ? "bg-blue-900" : "bg-slate-900";
  const sidebarBorder = isTenantMode ? "border-blue-800" : "border-slate-700";
  const activeNavClass = isTenantMode
    ? "bg-blue-600 text-white"
    : "bg-indigo-600 text-white";
  const inactiveNavClass = isTenantMode
    ? "text-blue-200 hover:bg-blue-800 hover:text-white"
    : "text-slate-300 hover:bg-slate-800 hover:text-white";

  function handleTenantSelect(id: string) {
    if (id) {
      router.push(`/superadmin/view/${id}/dashboard`);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 ${sidebarBg} text-white flex flex-col
          transition-transform duration-200
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Brand header */}
        <div className={`flex items-center gap-2 px-5 py-5 border-b ${sidebarBorder}`}>
          <Shield className="h-6 w-6 text-indigo-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-white">Super Admin</p>
            <p className={`text-xs ${isTenantMode ? "text-blue-300" : "text-slate-400"}`}>
              Platform Control
            </p>
          </div>
        </div>

        {/* Tenant mode: current tenant info */}
        {isTenantMode && currentTenant && (
          <div className={`px-4 py-3 border-b ${sidebarBorder} bg-blue-800/50`}>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
              <span className="text-xs font-semibold text-amber-300 uppercase tracking-wide">
                Viewing Tenant
              </span>
            </div>
            <p className="text-sm font-semibold text-white truncate">{currentTenant.name}</p>
            <p className="text-xs text-blue-300 font-mono">{currentTenant.slug}</p>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {!isTenantMode
            ? PLATFORM_NAV.map((item) => {
                const { href, label, icon: Icon } = item;
                const exact = "exact" in item ? (item as { exact?: boolean }).exact : false;
                const active = isActive(href, exact);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active ? activeNavClass : inactiveNavClass
                    }`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {label}
                  </Link>
                );
              })
            : navItems.map(({ href, label, icon: Icon, ...rest }) => {
                const exact = "exact" in rest ? (rest as { exact: boolean }).exact : false;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive(href, exact) ? activeNavClass : inactiveNavClass
                    }`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {label}
                  </Link>
                );
              })}
        </nav>

        {/* Tenant mode: exit link */}
        {isTenantMode && (
          <div className={`px-3 py-3 border-t ${sidebarBorder}`}>
            <Link
              href="/superadmin"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium
                text-blue-200 hover:bg-blue-800 hover:text-white transition-colors`}
            >
              <ChevronRight className="h-3.5 w-3.5 rotate-180" />
              Exit to Platform
            </Link>
          </div>
        )}

        {/* Sign out footer */}
        <div className={`px-3 py-3 border-t ${sidebarBorder}`}>
          <Button
            variant="ghost"
            size="sm"
            className={`w-full justify-start gap-2 ${
              isTenantMode
                ? "text-blue-300 hover:text-white hover:bg-blue-800"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
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
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main area */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
          <button
            className="lg:hidden p-1.5 rounded-md text-slate-600 hover:bg-slate-100"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Shield className="h-4 w-4 text-indigo-600 flex-shrink-0" />
            <span className="text-sm font-semibold text-slate-700 truncate">
              Platform Administration
            </span>
            {isTenantMode && currentTenant && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                <span className="text-sm font-semibold text-blue-700 truncate">
                  {currentTenant.name}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                  <Zap className="h-3 w-3" />
                  Viewing as Tenant
                </span>
              </>
            )}
          </div>
        </header>

        {/* Impersonation banner (tenant mode only) */}
        {isTenantMode && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center gap-3">
            <Zap className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-800 flex-1 min-w-0">
              <span className="font-semibold">You are viewing </span>
              {currentTenant?.name ?? "this tenant"}
              {"'s workspace as Super Admin. "}
              <span className="font-semibold">Changes here affect real tenant data.</span>
            </p>
            <Link
              href="/superadmin"
              className="text-xs font-semibold text-amber-700 hover:text-amber-900 hover:underline flex-shrink-0"
            >
              Exit to Platform
            </Link>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
