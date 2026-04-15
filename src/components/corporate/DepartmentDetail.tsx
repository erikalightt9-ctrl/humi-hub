"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { DeptConfig } from "./DepartmentsPage";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface DeptEmployee {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phone: string | null;
  readonly position: string;
  readonly department: string | null;
  readonly status: string;
  readonly employmentType: string | null;
  readonly employeeNumber: string | null;
}

type Tab = "members" | "activity" | "settings";

/* ------------------------------------------------------------------ */
/*  Ripple button                                                      */
/* ------------------------------------------------------------------ */

interface Ripple { id: number; x: number; y: number; size: number }

interface RippleButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

function RippleButton({ children, className = "", onClick }: RippleButtonProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  function createRipple(e: React.MouseEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x    = e.clientX - rect.left  - size / 2;
    const y    = e.clientY - rect.top   - size / 2;
    const id   = Date.now();

    setRipples((prev) => [...prev, { id, x, y, size }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 600);
  }

  return (
    <button
      onClick={(e) => { createRipple(e); onClick?.(e); }}
      className={`relative overflow-hidden ${className}`}
    >
      {children}
      {ripples.map((r) => (
        <span
          key={r.id}
          className="absolute rounded-full bg-white/40 animate-ripple pointer-events-none"
          style={{ width: r.size, height: r.size, top: r.y, left: r.x }}
        />
      ))}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Custom SVG icons                                                   */
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

function ActivityDot() {
  return <div className="w-2 h-2 mt-2 rounded-full bg-indigo-500 shrink-0" />;
}

/* ------------------------------------------------------------------ */
/*  Static activity feed                                               */
/* ------------------------------------------------------------------ */

const DEPT_ACTIVITIES: Record<string, ReadonlyArray<string>> = {
  "administration-hr":    ["New employee onboarding completed", "Company policy updated", "Recruitment drive launched"],
  "finance-payroll":      ["Payroll processed for this month", "Budget report submitted", "Government contributions filed"],
  "operations":           ["Weekly ops review conducted", "New workflow process approved", "SLA targets updated"],
  "sales-marketing":      ["Q2 sales targets achieved", "New marketing campaign launched", "Lead generation report submitted"],
  "it-systems":           ["System maintenance completed", "Security audit passed", "New software licenses acquired"],
  "logistics-procurement":["Supplier contracts renewed", "Inventory audit completed", "Fleet fuel logs reviewed"],
};

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function DepartmentDetail({
  dept,
  employees,
}: {
  readonly dept: DeptConfig;
  readonly employees: ReadonlyArray<DeptEmployee>;
  readonly total: number;
}) {
  const [tab, setTab]         = useState<Tab>("members");
  const [members, setMembers] = useState(employees.map((e) => ({ ...e })));
  const [headId, setHeadId]   = useState<string | null>(employees[0]?.id ?? null);
  const [search, setSearch]   = useState("");
  const [deptName, setDeptName]               = useState(dept.name);
  const [deptDescription, setDeptDescription] = useState(dept.description);

  const filtered   = members.filter((m) =>
    `${m.firstName} ${m.lastName}`.toLowerCase().includes(search.toLowerCase()),
  );
  const head       = members.find((m) => m.id === headId);
  const activities = DEPT_ACTIVITIES[dept.slug] ?? ["No recent activity."];

  function removeMember(id: string) {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    if (headId === id) setHeadId(members.find((m) => m.id !== id)?.id ?? null);
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Ripple keyframe */}
      <style>{`
        @keyframes ripple {
          0%   { transform: scale(0); opacity: 0.6; }
          100% { transform: scale(2); opacity: 0; }
        }
        .animate-ripple { animation: ripple 0.6s linear; }
      `}</style>

      {/* Back */}
      <Link href="/corporate/departments" className="text-indigo-600 hover:underline text-sm">
        ← Back to Departments
      </Link>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-2xl shadow flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4"
      >
        <div className="flex gap-4 items-center">
          <DepartmentIcon />
          <div>
            <h1 className="text-xl font-semibold">{deptName}</h1>
            <p className="text-gray-500 text-sm">{deptDescription}</p>
            <p className="text-sm mt-2 text-gray-600">
              {members.length} Members
              {head && (
                <> • Head: <span className="font-medium">{head.firstName} {head.lastName}</span></>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <RippleButton className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm transition">
            Edit
          </RippleButton>
          <RippleButton className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl shadow active:scale-95 transition text-sm font-medium">
            Add Member
          </RippleButton>
        </div>
      </motion.div>

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
                : "bg-white hover:bg-gray-100 text-gray-600"
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
        className="bg-white p-6 rounded-2xl shadow"
      >
        {/* ── Members ── */}
        {tab === "members" && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Search members..."
              className="w-full border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {filtered.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No members found.</p>
            ) : (
              <div className="space-y-2">
                {filtered.map((m) => (
                  <motion.div
                    key={m.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex justify-between items-center p-4 border border-gray-100 rounded-xl"
                  >
                    <div>
                      <div className="font-medium text-gray-800 flex items-center gap-2">
                        {m.firstName} {m.lastName}
                        {m.id === headId && (
                          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-600 font-medium">
                            <CrownIcon /> Head
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{m.email}</div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600 hidden sm:block">{m.position}</span>
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
            {activities.map((text, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3"
              >
                <ActivityDot />
                <div className="text-sm text-gray-700">{text}</div>
              </motion.div>
            ))}
          </div>
        )}

        {/* ── Settings ── */}
        {tab === "settings" && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Department Name</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={deptName}
                onChange={(e) => setDeptName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Description</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={deptDescription}
                onChange={(e) => setDeptDescription(e.target.value)}
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
