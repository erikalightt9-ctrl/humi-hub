"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Department config                                                  */
/* ------------------------------------------------------------------ */

interface DeptConfig {
  slug: string;
  name: string;
  description: string;
  emoji: string;
}

const DEPARTMENTS: DeptConfig[] = [
  { slug: "administration-hr",     name: "Administration & HR",     description: "Employee management, recruitment, policies",  emoji: "🧑‍💼" },
  { slug: "finance-payroll",       name: "Finance & Payroll",       description: "Budgeting, payroll, financial reports",        emoji: "💵" },
  { slug: "operations",            name: "Operations",               description: "Daily operations and workflow",                emoji: "⚙️" },
  { slug: "sales-marketing",       name: "Sales & Marketing",       description: "Sales, branding, lead generation",             emoji: "📈" },
  { slug: "it-systems",            name: "IT & Systems",             description: "System management and support",                emoji: "💻" },
  { slug: "logistics-procurement", name: "Logistics & Procurement", description: "Suppliers, inventory, fleet",                  emoji: "🚚" },
];

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ByDept { department: string | null; _count: number }

interface Stats {
  total: number;
  active: number;
  onLeave: number;
  inactive: number;
  byDept: ByDept[];
}

/* ------------------------------------------------------------------ */
/*  Ripple button                                                      */
/* ------------------------------------------------------------------ */

interface Ripple { id: number; x: number; y: number; size: number }

function RippleButton({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  function createRipple(e: React.MouseEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const id   = Date.now();
    setRipples((p) => [...p, { id, x: e.clientX - rect.left - size / 2, y: e.clientY - rect.top - size / 2, size }]);
    setTimeout(() => setRipples((p) => p.filter((r) => r.id !== id)), 600);
  }

  return (
    <button onClick={(e) => { createRipple(e); onClick?.(e); }} className={`relative overflow-hidden ${className}`}>
      {children}
      {ripples.map((r) => (
        <span key={r.id} className="absolute rounded-full bg-white/40 animate-ripple pointer-events-none"
          style={{ width: r.size, height: r.size, top: r.y, left: r.x }} />
      ))}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Dept card                                                          */
/* ------------------------------------------------------------------ */

function DeptCard({ dept, count }: { dept: DeptConfig; count: number }) {
  return (
    <Link
      href={`/admin/departments/${dept.slug}`}
      className="group cursor-pointer rounded-2xl p-6 bg-white border border-slate-200 shadow-sm hover:shadow-md transition duration-200 flex flex-col"
    >
      <div className="text-4xl mb-4">{dept.emoji}</div>
      <h2 className="text-lg font-semibold mb-1 text-slate-900 group-hover:text-indigo-600 transition-colors">
        {dept.name}
      </h2>
      <p className="text-sm text-slate-500 mb-4 flex-1">{dept.description}</p>
      <div className="flex justify-between items-center text-sm">
        <span className="text-slate-400">{count} members</span>
        <span className="text-indigo-600 group-hover:underline">View →</span>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AdminDepartmentsPage() {
  const [stats, setStats]     = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/hr/employees?stats=1")
      .then((r) => r.json())
      .then((j) => { if (j.success) setStats(j.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const byDeptMap = new Map(
    (stats?.byDept ?? []).map((d) => [d.department ?? "", d._count]),
  );

  const totalMembers = DEPARTMENTS.reduce(
    (sum, d) => sum + (byDeptMap.get(d.name) ?? 0),
    0,
  );

  return (
    <div className="p-6 space-y-6">
      <style>{`
        @keyframes ripple { 0% { transform: scale(0); opacity: 0.6; } 100% { transform: scale(2); opacity: 0; } }
        .animate-ripple { animation: ripple 0.6s linear; }
      `}</style>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="text-xl font-bold text-slate-900">Departments</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage and explore company departments
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-center shrink-0 shadow-sm">
          <p className="text-lg font-bold text-slate-900 leading-none">{totalMembers}</p>
          <p className="text-xs text-slate-400 mt-0.5">Total Members</p>
        </div>
      </motion.div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {DEPARTMENTS.map((dept, i) => (
          <motion.div
            key={dept.slug}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <DeptCard dept={dept} count={byDeptMap.get(dept.name) ?? 0} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
