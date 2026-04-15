"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Users,
  UserCheck,
  UserX,
  Coffee,
  Mail,
  Phone,
  Briefcase,
} from "lucide-react";
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

/* ------------------------------------------------------------------ */
/*  Status badge                                                       */
/* ------------------------------------------------------------------ */

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:     "bg-green-100 text-green-700",
  ON_LEAVE:   "bg-yellow-100 text-yellow-700",
  INACTIVE:   "bg-gray-100 text-gray-500",
  RESIGNED:   "bg-red-50 text-red-600",
  TERMINATED: "bg-red-100 text-red-700",
};

function StatusBadge({ status }: { readonly status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat card                                                          */
/* ------------------------------------------------------------------ */

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  readonly label: string;
  readonly value: number;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly accent: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
      <div className={`p-2.5 rounded-xl ${accent}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xl font-bold text-gray-800 leading-none">{value}</p>
        <p className="text-xs text-gray-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Employee row                                                       */
/* ------------------------------------------------------------------ */

interface EmployeeRowProps { emp: DeptEmployee }

function EmployeeRow({ emp }: EmployeeRowProps) {
  const initials = `${emp.firstName[0] ?? ""}${emp.lastName[0] ?? ""}`.toUpperCase();

  return (
    <div className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
      {/* Avatar */}
      <div className="h-9 w-9 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-indigo-600">{initials}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">
          {emp.firstName} {emp.lastName}
          {emp.employeeNumber && (
            <span className="ml-2 text-xs font-normal text-gray-400">#{emp.employeeNumber}</span>
          )}
        </p>
        <p className="text-xs text-gray-400 truncate flex items-center gap-1 mt-0.5">
          <Briefcase className="h-3 w-3 shrink-0" />
          {emp.position}
        </p>
      </div>

      {/* Contact */}
      <div className="hidden sm:flex flex-col gap-0.5 text-xs text-gray-400 min-w-0">
        <span className="flex items-center gap-1 truncate">
          <Mail className="h-3 w-3 shrink-0" /> {emp.email}
        </span>
        {emp.phone && (
          <span className="flex items-center gap-1">
            <Phone className="h-3 w-3 shrink-0" /> {emp.phone}
          </span>
        )}
      </div>

      {/* Status */}
      <div className="shrink-0">
        <StatusBadge status={emp.status} />
      </div>
    </div>
  );
}

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
  const active   = employees.filter((e) => e.status === "ACTIVE").length;
  const onLeave  = employees.filter((e) => e.status === "ON_LEAVE").length;
  const inactive = employees.filter((e) => e.status === "INACTIVE" || e.status === "RESIGNED" || e.status === "TERMINATED").length;

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Back link */}
      <Link
        href="/corporate/departments"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Departments
      </Link>

      {/* Header card */}
      <div className="bg-white rounded-2xl shadow p-6 flex items-center gap-5">
        <div className="text-5xl">{dept.emoji}</div>
        <div>
          <h1 className="text-xl font-semibold text-gray-800">{dept.name}</h1>
          <p className="text-sm text-gray-500 mt-1">{dept.description}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Members" value={total}    icon={Users}     accent="bg-indigo-50 text-indigo-600" />
        <StatCard label="Active"        value={active}   icon={UserCheck} accent="bg-green-50 text-green-600" />
        <StatCard label="On Leave"      value={onLeave}  icon={Coffee}    accent="bg-yellow-50 text-yellow-600" />
        <StatCard label="Inactive"      value={inactive} icon={UserX}     accent="bg-gray-50 text-gray-400" />
      </div>

      {/* Employee list */}
      <div className="bg-white rounded-2xl shadow">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Team Members</h2>
          <p className="text-xs text-gray-400 mt-0.5">{total} assigned to this department</p>
        </div>

        <div className="px-6">
          {employees.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3 text-center">
              <div className="text-5xl">{dept.emoji}</div>
              <div>
                <p className="text-sm font-semibold text-gray-700">No members yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Employees assigned to {dept.name} will appear here.
                </p>
              </div>
            </div>
          ) : (
            employees.map((emp) => <EmployeeRow key={emp.id} emp={emp} />)
          )}
        </div>
      </div>
    </div>
  );
}
