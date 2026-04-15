"use client";

import { useState } from "react";
import Link from "next/link";
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
/*  Static activity feed (per-department flavour)                     */
/* ------------------------------------------------------------------ */

const DEPT_ACTIVITIES: Record<string, ReadonlyArray<string>> = {
  "administration-hr": [
    "New employee onboarding completed",
    "Company policy updated",
    "Recruitment drive launched",
  ],
  "finance-payroll": [
    "Payroll processed for this month",
    "Budget report submitted",
    "Government contributions filed",
  ],
  operations: [
    "Weekly ops review conducted",
    "New workflow process approved",
    "SLA targets updated",
  ],
  "sales-marketing": [
    "Q2 sales targets achieved",
    "New marketing campaign launched",
    "Lead generation report submitted",
  ],
  "it-systems": [
    "System maintenance completed",
    "Security audit passed",
    "New software licenses acquired",
  ],
  "logistics-procurement": [
    "Supplier contracts renewed",
    "Inventory audit completed",
    "Fleet fuel logs reviewed",
  ],
};

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function DepartmentDetail({
  dept,
  employees,
  total,
}: {
  readonly dept: DeptConfig;
  readonly employees: ReadonlyArray<DeptEmployee>;
  readonly total: number;
}) {
  const [tab, setTab]         = useState<Tab>("members");
  const [members, setMembers] = useState(employees.map((e) => ({ ...e })));
  const [headId, setHeadId]   = useState<string | null>(employees[0]?.id ?? null);
  const [search, setSearch]   = useState("");
  const [deptName, setDeptName]         = useState(dept.name);
  const [deptDescription, setDeptDescription] = useState(dept.description);

  const filtered = members.filter((m) =>
    `${m.firstName} ${m.lastName}`.toLowerCase().includes(search.toLowerCase()),
  );

  const head    = members.find((m) => m.id === headId);
  const activities = DEPT_ACTIVITIES[dept.slug] ?? ["No recent activity."];

  function removeMember(id: string) {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    if (headId === id) setHeadId(members.find((m) => m.id !== id)?.id ?? null);
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Back */}
      <Link href="/corporate/departments" className="text-indigo-600 text-sm hover:underline">
        ← Back to Departments
      </Link>

      {/* Header card */}
      <div className="bg-white p-6 rounded-2xl shadow flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <span className="text-4xl">{dept.emoji}</span>
          <div>
            <h1 className="text-xl font-semibold">{deptName}</h1>
            <p className="text-gray-500 text-sm">{deptDescription}</p>
            <p className="text-sm mt-1 text-gray-600">
              Members: <span className="font-medium">{members.length}</span>
              {head && (
                <>
                  {" "}| Head:{" "}
                  <span className="font-medium">
                    {head.firstName} {head.lastName}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition-colors">
            Edit
          </button>
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors">
            Add Member
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["members", "activity", "settings"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl capitalize text-sm font-medium transition-colors ${
              tab === t ? "bg-indigo-600 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-600"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Members tab ── */}
      {tab === "members" && (
        <div className="bg-white p-6 rounded-2xl shadow space-y-4">
          <input
            type="text"
            placeholder="Search members..."
            className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No members found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 text-left">
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Role</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m) => (
                    <tr key={m.id} className="border-t border-gray-100">
                      <td className="py-3 pr-4">
                        <span className="font-medium text-gray-800">
                          {m.firstName} {m.lastName}
                        </span>
                        {m.id === headId && (
                          <span className="ml-2 text-yellow-500 text-xs">👑 Head</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-gray-500">{m.email}</td>
                      <td className="py-3 pr-4 text-gray-600">{m.position}</td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            m.status === "ACTIVE"
                              ? "bg-green-100 text-green-700"
                              : m.status === "ON_LEAVE"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {m.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 space-x-3 whitespace-nowrap">
                        {m.id !== headId && (
                          <button
                            onClick={() => setHeadId(m.id)}
                            className="text-indigo-600 hover:underline text-xs font-medium"
                          >
                            Set Head
                          </button>
                        )}
                        <button
                          onClick={() => removeMember(m.id)}
                          className="text-red-500 hover:underline text-xs font-medium"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Activity tab ── */}
      {tab === "activity" && (
        <div className="bg-white p-6 rounded-2xl shadow space-y-3">
          {activities.map((text, i) => (
            <div key={i} className="border-l-4 border-indigo-500 pl-4 py-1 text-sm text-gray-700">
              {text}
            </div>
          ))}
        </div>
      )}

      {/* ── Settings tab ── */}
      {tab === "settings" && (
        <div className="bg-white p-6 rounded-2xl shadow space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Department Name</label>
            <input
              className="w-full border border-gray-200 rounded-xl px-4 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Description</label>
            <input
              className="w-full border border-gray-200 rounded-xl px-4 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value={deptDescription}
              onChange={(e) => setDeptDescription(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors">
              Save Changes
            </button>
            <button className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors">
              Delete Department
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
