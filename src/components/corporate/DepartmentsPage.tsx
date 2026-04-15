"use client";

import Link from "next/link";
import {
  UserCog,
  Wallet,
  Settings2,
  TrendingUp,
  Monitor,
  Truck,
  ArrowRight,
  Users,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Department definitions                                             */
/* ------------------------------------------------------------------ */

export interface DeptCount {
  readonly department: string;
  readonly count: number;
}

interface DeptConfig {
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly bullets: ReadonlyArray<string>;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly accent: string;
  readonly iconColor: string;
}

const DEPARTMENTS: ReadonlyArray<DeptConfig> = [
  {
    slug: "administration-hr",
    name: "Administration & HR",
    description: "Employee management, recruitment, onboarding, and internal coordination.",
    bullets: [
      "Employee management & records",
      "Recruitment and onboarding",
      "Company policies",
      "Internal coordination",
    ],
    icon: UserCog,
    accent: "bg-purple-50",
    iconColor: "text-purple-700",
  },
  {
    slug: "finance-payroll",
    name: "Finance & Payroll",
    description: "Financial management, budgeting, payroll processing, and government contributions.",
    bullets: [
      "Financial management & reporting",
      "Budgeting and expense tracking",
      "Payroll processing",
      "SSS, PhilHealth, Pag-IBIG",
    ],
    icon: Wallet,
    accent: "bg-emerald-50",
    iconColor: "text-emerald-700",
  },
  {
    slug: "operations",
    name: "Operations",
    description: "Day-to-day business activities, service delivery, and workflow management.",
    bullets: [
      "Day-to-day business activities",
      "Service delivery & production",
      "Workflow and process management",
    ],
    icon: Settings2,
    accent: "bg-orange-50",
    iconColor: "text-orange-700",
  },
  {
    slug: "sales-marketing",
    name: "Sales & Marketing",
    description: "Sales, client acquisition, marketing campaigns, and revenue growth.",
    bullets: [
      "Sales and client acquisition",
      "Marketing campaigns & branding",
      "Lead generation and revenue growth",
    ],
    icon: TrendingUp,
    accent: "bg-pink-50",
    iconColor: "text-pink-700",
  },
  {
    slug: "it-systems",
    name: "IT & Systems",
    description: "System development, technical support, data security, and infrastructure.",
    bullets: [
      "System development & maintenance",
      "Technical support",
      "Data security and infrastructure",
    ],
    icon: Monitor,
    accent: "bg-blue-50",
    iconColor: "text-blue-700",
  },
  {
    slug: "logistics-procurement",
    name: "Logistics & Procurement",
    description: "Purchasing, supplier management, inventory sourcing, and fleet management.",
    bullets: [
      "Purchasing and supplier management",
      "Inventory sourcing",
      "Transportation and fleet management",
      "Fuel request logs",
    ],
    icon: Truck,
    accent: "bg-amber-50",
    iconColor: "text-amber-700",
  },
];

/* ------------------------------------------------------------------ */
/*  Department card                                                    */
/* ------------------------------------------------------------------ */

interface DeptCardProps {
  dept: DeptConfig;
  memberCount: number;
}

function DeptCard({ dept, memberCount }: DeptCardProps) {
  const Icon = dept.icon;

  return (
    <Link
      href={`/corporate/departments/${dept.slug}`}
      className="group bg-ds-card rounded-2xl border border-ds-border p-6 flex flex-col gap-4 hover:border-ds-primary/50 hover:shadow-xl hover:shadow-black/10 hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Icon + member count */}
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-2xl ${dept.accent}`}>
          <Icon className={`h-6 w-6 ${dept.iconColor}`} />
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-ds-muted bg-ds-bg px-2.5 py-1 rounded-full">
          <Users className="h-3 w-3" />
          <span>{memberCount}</span>
        </div>
      </div>

      {/* Name + description */}
      <div>
        <p className="font-bold text-ds-text text-sm group-hover:text-blue-700 transition-colors leading-snug">
          {dept.name}
        </p>
        <p className="text-xs text-ds-muted mt-1.5 leading-relaxed">{dept.description}</p>
      </div>

      {/* Bullet list */}
      <ul className="space-y-1">
        {dept.bullets.map((b) => (
          <li key={b} className="flex items-center gap-2 text-xs text-ds-muted">
            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dept.accent.replace("bg-", "bg-").replace("50", "400")}`} />
            {b}
          </li>
        ))}
      </ul>

      {/* Hover CTA */}
      <div className="flex items-center gap-1 text-xs text-blue-700 font-semibold opacity-0 group-hover:opacity-100 transition-opacity mt-auto pt-1">
        View Department <ArrowRight className="h-3 w-3" />
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export function DepartmentsPage({
  deptCounts,
}: {
  readonly deptCounts: ReadonlyArray<DeptCount>;
}) {
  const countMap = new Map(deptCounts.map((d) => [d.department, d.count]));

  const totalMembers = deptCounts.reduce((s, d) => s + d.count, 0);

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-ds-text">Departments</h1>
          <p className="text-sm text-ds-muted mt-0.5">
            Manage your organization's departments and assigned members
          </p>
        </div>
        <div className="bg-ds-card border border-ds-border rounded-xl px-4 py-2.5 text-center shrink-0">
          <p className="text-lg font-bold text-ds-text leading-none">{totalMembers}</p>
          <p className="text-xs text-ds-muted mt-0.5">Total Members</p>
        </div>
      </div>

      {/* Department grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {DEPARTMENTS.map((dept) => (
          <DeptCard
            key={dept.slug}
            dept={dept}
            memberCount={countMap.get(dept.name) ?? 0}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Export config for use in detail pages                             */
/* ------------------------------------------------------------------ */

export { DEPARTMENTS };
export type { DeptConfig };
