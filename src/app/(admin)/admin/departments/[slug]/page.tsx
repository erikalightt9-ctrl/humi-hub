"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
  activities: string[];
}

const DEPARTMENTS: DeptConfig[] = [
  {
    slug: "administration-hr",
    name: "Administration & HR",
    description: "Employee management, recruitment, policies",
    emoji: "🧑‍💼",
    activities: ["New employee onboarding completed", "Company policy updated", "Recruitment drive launched"],
  },
  {
    slug: "finance-payroll",
    name: "Finance & Payroll",
    description: "Budgeting, payroll, financial reports",
    emoji: "💵",
    activities: ["Payroll processed for this month", "Budget report submitted", "Government contributions filed"],
  },
  {
    slug: "operations",
    name: "Operations",
    description: "Daily operations and workflow",
    emoji: "⚙️",
    activities: ["Weekly ops review conducted", "New workflow process approved", "SLA targets updated"],
  },
  {
    slug: "sales-marketing",
    name: "Sales & Marketing",
    description: "Sales, branding, lead generation",
    emoji: "📈",
    activities: ["Q2 sales targets achieved", "New marketing campaign launched", "Lead generation report submitted"],
  },
  {
    slug: "it-systems",
    name: "IT & Systems",
    description: "System management and support",
    emoji: "💻",
    activities: ["System maintenance completed", "Security audit passed", "New software licenses acquired"],
  },
  {
    slug: "logistics-procurement",
    name: "Logistics & Procurement",
    description: "Suppliers, inventory, fleet",
    emoji: "🚚",
    activities: ["Supplier contracts renewed", "Inventory audit completed", "Fleet fuel logs reviewed"],
  },
];

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  position: string;
  status: string;
  employeeNumber: string | null;
}

type Tab = "members" | "activity" | "settings";

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
/*  SVG icons                                                          */
/* ------------------------------------------------------------------ */

function DepartmentIcon() {
  return (
    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow shrink-0">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white">
        <rect x="3"  y="10" width="6" height="10" stroke="currentColor" strokeWidth="1.5" />
        <rect x="9"  y="6"  width="6" height="14" stroke="currentColor" strokeWidth="1.5" />
        <rect x="15" y="12" width="6" height="8"  stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

function CrownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M3 10L7 4L12 10L17 4L21 10V20H3V10Z" stroke="#EAB308" strokeWidth="1.5" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Status badge                                                       */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ACTIVE:     "bg-green-100 text-green-700",
    ON_LEAVE:   "bg-amber-100 text-amber-700",
    INACTIVE:   "bg-slate-100 text-slate-500",
    RESIGNED:   "bg-red-50 text-red-600",
    TERMINATED: "bg-red-100 text-red-700",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? "bg-slate-100 text-slate-500"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat card                                                          */
/* ------------------------------------------------------------------ */

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className={`text-xs mt-1 font-medium ${accent}`}>{label}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AdminDepartmentDetailPage() {
  const params              = useParams();
  const slug                = typeof params.slug === "string" ? params.slug : "";
  const dept                = DEPARTMENTS.find((d) => d.slug === slug) ?? null;

  const [tab, setTab]             = useState<Tab>("members");
  const [members, setMembers]     = useState<Employee[]>([]);
  const [headId, setHeadId]       = useState<string | null>(null);
  const [search, setSearch]       = useState("");
  const [loading, setLoading]     = useState(true);
  const [deptName, setDeptName]   = useState(dept?.name ?? "");
  const [deptDesc, setDeptDesc]   = useState(dept?.description ?? "");

  useEffect(() => {
    if (!dept) return;
    setLoading(true);
    const encoded = encodeURIComponent(dept.name);
    fetch(`/api/admin/hr/employees?department=${encoded}&limit=100`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          const list: Employee[] = j.data.data.map((e: {
            id: string; firstName: string; lastName: string;
            email: string; phone?: string | null;
            position: string; status: string; employeeNumber?: string | null;
          }) => ({
            id: e.id, firstName: e.firstName, lastName: e.lastName,
            email: e.email, phone: e.phone ?? null,
            position: e.position, status: e.status,
            employeeNumber: e.employeeNumber ?? null,
          }));
          setMembers(list);
          setHeadId(list[0]?.id ?? null);
        }
      })
      .finally(() => setLoading(false));
  }, [dept?.name]);

  if (!dept) {
    return (
      <div className="p-6">
        <Link href="/admin/departments" className="text-indigo-600 hover:underline text-sm">← Back to Departments</Link>
        <p className="mt-4 text-slate-500 text-sm">Department not found.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const filtered = members.filter((m) =>
    `${m.firstName} ${m.lastName}`.toLowerCase().includes(search.toLowerCase()),
  );
  const head     = members.find((m) => m.id === headId);
  const active   = members.filter((m) => m.status === "ACTIVE").length;
  const onLeave  = members.filter((m) => m.status === "ON_LEAVE").length;
  const inactive = members.filter((m) => !["ACTIVE", "ON_LEAVE"].includes(m.status)).length;

  function removeMember(id: string) {
    setMembers((p) => p.filter((m) => m.id !== id));
    if (headId === id) setHeadId(members.find((m) => m.id !== id)?.id ?? null);
  }

  return (
    <div className="p-6 space-y-6">
      <style>{`
        @keyframes ripple { 0% { transform: scale(0); opacity: 0.6; } 100% { transform: scale(2); opacity: 0; } }
        .animate-ripple { animation: ripple 0.6s linear; }
      `}</style>

      {/* Back */}
      <Link href="/admin/departments" className="text-indigo-600 hover:underline text-sm">
        ← Back to Departments
      </Link>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4"
      >
        <div className="flex gap-4 items-center">
          <DepartmentIcon />
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{deptName}</h1>
            <p className="text-slate-500 text-sm">{deptDesc}</p>
            <p className="text-sm mt-2 text-slate-600">
              {members.length} Members
              {head && (
                <> • Head: <span className="font-medium">{head.firstName} {head.lastName}</span></>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <RippleButton className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm transition">
            Edit
          </RippleButton>
          <RippleButton className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl shadow active:scale-95 transition text-sm font-medium">
            Add Member
          </RippleButton>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Members" value={members.length} accent="text-indigo-600" />
        <StatCard label="Active"        value={active}         accent="text-green-600" />
        <StatCard label="On Leave"      value={onLeave}        accent="text-amber-600" />
        <StatCard label="Inactive"      value={inactive}       accent="text-slate-400" />
      </div>

      {/* Tabs */}
      <div className="flex gap-3">
        {(["members", "activity", "settings"] as Tab[]).map((t) => (
          <motion.button
            key={t}
            whileTap={{ scale: 0.95 }}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm capitalize transition ${
              tab === t
                ? "bg-indigo-600 text-white shadow"
                : "bg-white border border-slate-200 hover:bg-slate-50 text-slate-600"
            }`}
          >
            {t}
          </motion.button>
        ))}
      </div>

      {/* Content */}
      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6"
      >
        {/* ── Members ── */}
        {tab === "members" && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Search members..."
              className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {filtered.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No members found.</p>
            ) : (
              <div className="space-y-2">
                {filtered.map((m) => (
                  <motion.div
                    key={m.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex justify-between items-center p-4 border border-slate-100 rounded-xl"
                  >
                    <div>
                      <div className="font-medium text-slate-900 flex items-center gap-2">
                        {m.firstName} {m.lastName}
                        {m.id === headId && (
                          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-600 font-medium">
                            <CrownIcon /> Head
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-500">{m.email}</div>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4">
                      <span className="text-sm text-slate-500 hidden sm:block">{m.position}</span>
                      <StatusBadge status={m.status} />
                      {m.id !== headId && (
                        <RippleButton
                          onClick={() => setHeadId(m.id)}
                          className="text-indigo-600 text-xs font-medium hover:underline"
                        >
                          Set Head
                        </RippleButton>
                      )}
                      <RippleButton
                        onClick={() => removeMember(m.id)}
                        className="text-red-500 text-xs font-medium hover:underline"
                      >
                        Remove
                      </RippleButton>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Activity ── */}
        {tab === "activity" && (
          <div className="space-y-3">
            {dept.activities.map((text, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3"
              >
                <div className="w-2 h-2 mt-2 rounded-full bg-indigo-500 shrink-0" />
                <div className="text-sm text-slate-700">{text}</div>
              </motion.div>
            ))}
          </div>
        )}

        {/* ── Settings ── */}
        {tab === "settings" && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Department Name</label>
              <input
                className="w-full border border-slate-200 rounded-xl px-4 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={deptName}
                onChange={(e) => setDeptName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Description</label>
              <input
                className="w-full border border-slate-200 rounded-xl px-4 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={deptDesc}
                onChange={(e) => setDeptDesc(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <RippleButton className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition">
                Save Changes
              </RippleButton>
              <RippleButton className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition">
                Delete Department
              </RippleButton>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
