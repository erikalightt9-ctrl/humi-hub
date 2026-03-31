"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  UserPlus,
  BarChart3,
  LifeBuoy,
  FileText,
  Shield,
  LogOut,
  Bell,
  ChevronRight,
} from "lucide-react";
import type { HumiAdminPermissions } from "@/types/next-auth";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  permission: keyof HumiAdminPermissions | null;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/humi-admin",             label: "Dashboard",     icon: LayoutDashboard, permission: null },
  { href: "/humi-admin/tenants",     label: "Tenant Review", icon: Building2,       permission: "canReviewTenants" },
  { href: "/humi-admin/onboarding",  label: "Onboarding",    icon: UserPlus,        permission: "canOnboardTenants" },
  { href: "/humi-admin/monitoring",  label: "Monitoring",    icon: BarChart3,       permission: "canMonitorPlatform" },
  { href: "/humi-admin/support",     label: "Support",       icon: LifeBuoy,        permission: "canProvideSupport" },
  { href: "/humi-admin/content",     label: "Content",       icon: FileText,        permission: "canManageContent" },
];

export function HumiAdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const permissions = (session?.user as typeof session.user & {
    humiAdminPermissions: HumiAdminPermissions | null;
  })?.humiAdminPermissions;

  const visibleItems = NAV_ITEMS.filter(
    (item) => item.permission === null || (permissions?.[item.permission] ?? false)
  );

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-none">HUMI Hub</p>
              <p className="text-slate-400 text-xs mt-0.5">Admin Portal</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
                {isActive && <ChevronRight className="w-3 h-3 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="px-4 py-4 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {session?.user?.name?.[0]?.toUpperCase() ?? "H"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{session?.user?.name}</p>
              <p className="text-slate-400 text-xs truncate">{session?.user?.email}</p>
            </div>
            <button className="text-slate-400 hover:text-white">
              <Bell className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/humi-admin/login" })}
            className="w-full flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
