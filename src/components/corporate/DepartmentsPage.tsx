"use client";

import Link from "next/link";

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
  readonly emoji: string;
}

const DEPARTMENTS: ReadonlyArray<DeptConfig> = [
  {
    slug: "administration-hr",
    name: "Administration & HR",
    description: "Employee management, recruitment, policies",
    emoji: "🧑‍💼",
  },
  {
    slug: "finance-payroll",
    name: "Finance & Payroll",
    description: "Budgeting, payroll, financial reports",
    emoji: "💵",
  },
  {
    slug: "operations",
    name: "Operations",
    description: "Daily operations and workflow",
    emoji: "⚙️",
  },
  {
    slug: "sales-marketing",
    name: "Sales & Marketing",
    description: "Sales, branding, lead generation",
    emoji: "📈",
  },
  {
    slug: "it-systems",
    name: "IT & Systems",
    description: "System management and support",
    emoji: "💻",
  },
  {
    slug: "logistics-procurement",
    name: "Logistics & Procurement",
    description: "Suppliers, inventory, fleet",
    emoji: "🚚",
  },
];

/* ------------------------------------------------------------------ */
/*  Card                                                               */
/* ------------------------------------------------------------------ */

interface DeptCardProps {
  dept: DeptConfig;
  memberCount: number;
}

function DeptCard({ dept, memberCount }: DeptCardProps) {
  return (
    <Link
      href={`/corporate/departments/${dept.slug}`}
      className="group cursor-pointer rounded-2xl p-6 bg-white shadow hover:shadow-lg transition duration-200 flex flex-col"
    >
      {/* Emoji icon */}
      <div className="text-4xl mb-4">{dept.emoji}</div>

      {/* Title */}
      <h2 className="text-lg font-semibold mb-1 group-hover:text-indigo-600 transition-colors">
        {dept.name}
      </h2>

      {/* Description */}
      <p className="text-sm text-gray-500 mb-4 flex-1">{dept.description}</p>

      {/* Footer */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-400">{memberCount} members</span>
        <span className="text-indigo-600 group-hover:underline">View →</span>
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Departments</h1>
        <p className="text-gray-500 text-sm">Manage and explore company departments</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
/*  Exports                                                            */
/* ------------------------------------------------------------------ */

export { DEPARTMENTS };
export type { DeptConfig };
