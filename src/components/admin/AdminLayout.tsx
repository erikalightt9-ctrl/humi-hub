"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  GraduationCap,
  Settings,
  Menu,
  X,
  LogOut,
  Shield,
  ExternalLink,
  Briefcase,
  UserCheck,
  Activity,
  MonitorDot,
  Landmark,
  Users,
  TrendingUp,
  Monitor,
  Lock,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { ChatWidgetEnhanced } from "@/components/shared/ChatWidgetEnhanced";
import { AdminProfileDropdown } from "@/components/admin/AdminProfileDropdown";
import { AdminMobileNav } from "@/components/admin/AdminMobileNav";
import { signOut, useSession } from "next-auth/react";
import type { ModuleKey } from "@/lib/modules";
import { canAccessNav, ROLE_CONFIG } from "@/lib/rbac";
import type { UserRole } from "@/lib/rbac";

/* ------------------------------------------------------------------ */
/*  Nav data model                                                     */
/* ------------------------------------------------------------------ */

interface NavItem {
  readonly href: string;
  readonly label: string;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly exact?: boolean;
  readonly moduleKey?: ModuleKey;
  readonly industries?: string[];
  readonly adminOnly?: boolean;
  readonly comingSoon?: boolean;
  readonly children?: ReadonlyArray<NavItem>;
}

interface NavSection {
  readonly label: string;
  readonly items: ReadonlyArray<NavItem>;
}

const NAV_SECTIONS: ReadonlyArray<NavSection> = [
  {
    label: "Overview",
    items: [
      { href: "/admin/executive", label: "Command Center", icon: MonitorDot },
    ],
  },
  {
    label: "Departments",
    items: [
      { href: "/admin/admin",       label: "Office Admin",      icon: Briefcase,   moduleKey: "module_admin"      },
      { href: "/admin/accounting",  label: "Accounting",         icon: DollarSign,  moduleKey: "module_accounting" },
      {
        href: "/admin/hr",          label: "HR & People",        icon: Users,       moduleKey: "module_hr",
        children: [
          { href: "/admin/operations",      label: "Operations", icon: Activity                             },
          { href: "/admin/training-center", label: "Training",   icon: GraduationCap, moduleKey: "module_lms" },
        ],
      },
      { href: "/admin/finance",     label: "Finance",            icon: Landmark,    moduleKey: "module_accounting" },
      {
        href: "/admin/sales",       label: "Sales & Marketing",  icon: TrendingUp,
        children: [
          { href: "/admin/sales/deals",     label: "Pipeline",   icon: TrendingUp  },
          { href: "/admin/sales/contacts",  label: "Contacts",   icon: Users       },
          { href: "/admin/sales/campaigns", label: "Campaigns",  icon: Activity    },
        ],
      },
      {
        href: "/admin/it",          label: "IT & Systems",       icon: Monitor,
        children: [
          { href: "/admin/it/assets",   label: "Assets",      icon: Monitor   },
          { href: "/admin/it/requests", label: "IT Requests",  icon: Briefcase },
        ],
      },
    ],
  },
];

const PLATFORM_ITEMS: ReadonlyArray<NavItem> = [
  { href: "/admin/users-roles", label: "Users & Roles", icon: UserCheck, adminOnly: true },
  { href: "/admin/settings",    label: "Settings",      icon: Settings,  adminOnly: true },
];

/* ------------------------------------------------------------------ */
/*  Layout                                                             */
/* ------------------------------------------------------------------ */

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session } = useSession();

  const isSuperAdmin  = (session?.user as { isSuperAdmin?: boolean })?.isSuperAdmin  === true;
  const isTenantAdmin = (session?.user as { isTenantAdmin?: boolean })?.isTenantAdmin === true;
  const isTenantUser  = (session?.user as { isTenantUser?: boolean })?.isTenantUser  === true;
  const userPermissions: string[] | null =
    (session?.user as { permissions?: string[] | null })?.permissions ?? null;
  const userRole = (session?.user as { userRole?: string | null })?.userRole as UserRole | null ?? null;

  const [enabledModules, setEnabledModules] = useState<Partial<Record<ModuleKey, boolean>>>({
    module_lms: true,
  });
  const [tenantIndustry, setTenantIndustry] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/tenant-modules")
      .then((r) => r.json())
      .then((d: { success: boolean; data: { modules: Record<ModuleKey, boolean>; industry: string | null } }) => {
        if (d.success) {
          setEnabledModules(d.data.modules);
          setTenantIndustry(d.data.industry);
        }
      })
      .catch(() => {});
  }, []);

  function filterItem(item: NavItem): boolean {
    if (item.comingSoon) return true;
    if (!canAccessNav(userRole, item.href)) return false;
    if (item.moduleKey) {
      if (isTenantUser && userPermissions !== null) {
        if (!userPermissions.includes(item.moduleKey)) return false;
      } else {
        if (!enabledModules[item.moduleKey]) return false;
      }
    }
    if (item.industries && !item.industries.includes(tenantIndustry ?? "")) return false;
    return true;
  }

  const visibleSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter(filterItem),
  })).filter((section) => section.items.length > 0);

  const visiblePlatform = PLATFORM_ITEMS.filter((item) =>
    canAccessNav(userRole, item.href) && (isTenantAdmin || isSuperAdmin)
  );

  function isActive({ href, exact }: NavItem) {
    if (exact) return pathname === href;
    // Special case: /admin/executive should not match /admin
    return pathname === href || pathname.startsWith(href + "/");
  }

  const roleCfg = userRole ? ROLE_CONFIG[userRole] : null;

  const navLink = (item: NavItem): React.ReactNode => {
    if (item.comingSoon) {
      return (
        <div
          key={item.href}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-blue-100/30 cursor-not-allowed select-none"
        >
          <item.icon className="h-4 w-4 shrink-0" />
          {item.label}
          <span className="ml-auto inline-flex items-center gap-0.5 text-[9px] font-bold bg-white/10 px-1.5 py-0.5 rounded-full">
            <Lock className="h-2 w-2" />
            Soon
          </span>
        </div>
      );
    }

    const active = isActive(item);
    const link = (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setSidebarOpen(false)}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
          active
            ? "bg-white/20 text-white"
            : "text-blue-100/80 hover:bg-white/10 hover:text-white",
        )}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        {item.label}
      </Link>
    );

    const visibleChildren = item.children?.filter(filterItem) ?? [];
    if (!visibleChildren.length) return link;

    return (
      <div key={item.href}>
        {link}
        <div className="ml-[1.1rem] mt-0.5 pl-3 border-l border-white/10 space-y-0.5">
          {visibleChildren.map((child) => {
            const childActive = isActive(child);
            return (
              <Link
                key={child.href}
                href={child.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors",
                  childActive
                    ? "bg-white/20 text-white"
                    : "text-blue-100/60 hover:bg-white/10 hover:text-white",
                )}
              >
                <child.icon className="h-3.5 w-3.5 shrink-0" />
                {child.label}
              </Link>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-ds-bg overflow-hidden">

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside
        className={cn(
          "w-56 bg-ds-surface text-white flex flex-col shrink-0",
          "fixed inset-y-0 left-0 z-50 transition-transform duration-200",
          "md:relative md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Brand */}
        <div className="px-5 py-4 border-b border-white/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">HUMI Hub</p>
              <p className="text-[10px] text-blue-200 mt-0.5">Admin Portal</p>
            </div>
          </div>
          <button
            className="md:hidden p-1 rounded-lg text-blue-100 hover:text-white hover:bg-white/10 transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Role badge */}
        {roleCfg && (
          <div className="px-4 py-2 border-b border-white/10">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${roleCfg.badgeClass}`}>
              {roleCfg.label}
            </span>
          </div>
        )}

        {/* Grouped nav */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-5">
          {visibleSections.map((section) => (
            <div key={section.label}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-300/50 px-3 mb-1.5">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map(navLink)}
              </div>
            </div>
          ))}

          {/* Platform section */}
          {visiblePlatform.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-300/50 px-3 mb-1.5">
                Platform
              </p>
              <div className="space-y-0.5">
                {visiblePlatform.map(navLink)}
              </div>
            </div>
          )}
        </nav>

        {/* Super-admin shortcut */}
        {isSuperAdmin && (
          <div className="px-3 pb-2 border-t border-white/20 pt-3">
            <Link
              href="/superadmin"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-blue-100/80 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Shield className="h-4 w-4 shrink-0" />
              Multi-Tenant Admin
              <ExternalLink className="h-3 w-3 ml-auto shrink-0 opacity-60" />
            </Link>
          </div>
        )}

        {/* Sign out */}
        <div className="px-3 py-3 border-t border-white/20">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-blue-100/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 md:px-6 h-14 border-b border-white/20 bg-ds-surface shrink-0">
          <button
            className="md:hidden p-2 rounded-xl text-white hover:bg-white/10 transition-colors shrink-0"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2 font-bold text-sm text-white md:hidden">
            <GraduationCap className="h-5 w-5 text-ds-primary" />
            HUMI Hub Admin
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2 shrink-0">
            <NotificationBell />
            <AdminProfileDropdown />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8">
          {children}
        </main>
      </div>

      <AdminMobileNav />
      <ChatWidgetEnhanced role="admin" currentPage={pathname} />
    </div>
  );
}
