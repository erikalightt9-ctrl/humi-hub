"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Users,
  UserCheck,
  UserX,
  Coffee,
  BadgeCheck,
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
    <div className="bg-ds-card rounded-xl border border-ds-border p-4 flex items-center gap-3">
      <div className={`p-2.5 rounded-xl ${accent}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xl font-bold text-ds-text leading-none">{value}</p>
        <p className="text-xs text-ds-muted mt-0.5">{label}</p>
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
    <div className="flex items-center gap-4 py-3 border-b border-ds-border last:border-0">
      {/* Avatar */}
      <div className="h-9 w-9 rounded-full bg-ds-primary/10 flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-ds-primary">{initials}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ds-text truncate">
          {emp.firstName} {emp.lastName}
          {emp.employeeNumber && (
            <span className="ml-2 text-xs font-normal text-ds-muted">#{emp.employeeNumber}</span>
          )}
        </p>
        <p className="text-xs text-ds-muted truncate flex items-center gap-1 mt-0.5">
          <Briefcase className="h-3 w-3 shrink-0" />
          {emp.position}
        </p>
      </div>

      {/* Contact */}
      <div className="hidden sm:flex flex-col gap-0.5 text-xs text-ds-muted min-w-0">
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
  const Icon = dept.icon;

  const active    = employees.filter((e) => e.status === "ACTIVE").length;
  const onLeave   = employees.filter((e) => e.status === "ON_LEAVE").length;
  const inactive  = employees.filter((e) => e.status === "INACTIVE" || e.status === "RESIGNED" || e.status === "TERMINATED").length;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Back link */}
      <Link
        href="/corporate/departments"
        className="inline-flex items-center gap-1.5 text-sm text-ds-muted hover:text-ds-text transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Departments
      </Link>

      {/* Header card */}
      <div className="bg-ds-card rounded-2xl border border-ds-border p-6 flex items-start gap-5">
        <div className={`p-4 rounded-2xl ${dept.accent} shrink-0`}>
          <Icon className={`h-8 w-8 ${dept.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-ds-text">{dept.name}</h1>
          <p className="text-sm text-ds-muted mt-1 leading-relaxed">{dept.description}</p>
          {/* Bullet list */}
          <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1">
            {dept.bullets.map((b) => (
              <li key={b} className="flex items-center gap-1.5 text-xs text-ds-muted">
                <BadgeCheck className={`h-3.5 w-3.5 shrink-0 ${dept.iconColor}`} />
                {b}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Members"   value={total}    icon={Users}     accent={`${dept.accent}`} />
        <StatCard label="Active"          value={active}   icon={UserCheck} accent="bg-green-50 text-green-700" />
        <StatCard label="On Leave"        value={onLeave}  icon={Coffee}    accent="bg-yellow-50 text-yellow-700" />
        <StatCard label="Inactive"        value={inactive} icon={UserX}     accent="bg-gray-50 text-gray-500" />
      </div>

      {/* Employee list */}
      <div className="bg-ds-card rounded-2xl border border-ds-border">
        <div className="px-6 py-4 border-b border-ds-border flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-ds-text">Team Members</h2>
            <p className="text-xs text-ds-muted mt-0.5">{total} assigned to this department</p>
          </div>
        </div>

        <div className="px-6">
          {employees.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3 text-center">
              <div className={`p-4 rounded-2xl ${dept.accent}`}>
                <Icon className={`h-8 w-8 ${dept.iconColor}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-ds-text">No members yet</p>
                <p className="text-xs text-ds-muted mt-1">
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
