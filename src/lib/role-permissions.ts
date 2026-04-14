/**
 * Role & Permission definitions for the Tenant portal.
 *
 * Permissions are split into two layers:
 *  1. Module access  — which top-level modules the role can see (maps to MODULE_KEYS)
 *  2. Section access — granular action toggles per HR/workspace feature
 */

import { MODULE_KEYS } from "@/lib/modules";
import type { ModuleKey } from "@/lib/modules";

/* ------------------------------------------------------------------ */
/*  Section Permissions                                                 */
/* ------------------------------------------------------------------ */

export interface EmployeePerms   { view: boolean; create: boolean; edit: boolean; delete: boolean }
export interface PayrollPerms    { view: boolean; process: boolean; approve: boolean }
export interface AttendancePerms { view: boolean; log: boolean; approve: boolean }
export interface LeavePerms      { view: boolean; approve: boolean }
export interface FuelPerms       { view: boolean; approve: boolean }
export interface GovPerms        { view: boolean; configure: boolean }
export interface SettingsPerms   { view: boolean; manage: boolean }

export interface SectionPermissions {
  employees:         EmployeePerms;
  payroll:           PayrollPerms;
  attendance:        AttendancePerms;
  leave_requests:    LeavePerms;
  fuel_requests:     FuelPerms;
  gov_contributions: GovPerms;
  settings:          SettingsPerms;
}

export type SectionKey = keyof SectionPermissions;

export interface RolePermissions {
  modules:  Record<ModuleKey, boolean>;
  sections: SectionPermissions;
}

/* ------------------------------------------------------------------ */
/*  Section metadata (for UI rendering)                                */
/* ------------------------------------------------------------------ */

export interface PermissionAction {
  readonly key:   string;
  readonly label: string;
}

export interface PermissionSection {
  readonly key:     SectionKey;
  readonly label:   string;
  readonly actions: readonly PermissionAction[];
}

export const PERMISSION_SECTIONS: readonly PermissionSection[] = [
  {
    key: "employees",
    label: "Employees",
    actions: [
      { key: "view",   label: "View"   },
      { key: "create", label: "Create" },
      { key: "edit",   label: "Edit"   },
      { key: "delete", label: "Delete" },
    ],
  },
  {
    key: "payroll",
    label: "Payroll",
    actions: [
      { key: "view",    label: "View"    },
      { key: "process", label: "Process" },
      { key: "approve", label: "Approve" },
    ],
  },
  {
    key: "attendance",
    label: "Attendance",
    actions: [
      { key: "view",    label: "View"    },
      { key: "log",     label: "Log"     },
      { key: "approve", label: "Approve" },
    ],
  },
  {
    key: "leave_requests",
    label: "Leave Requests",
    actions: [
      { key: "view",    label: "View"    },
      { key: "approve", label: "Approve" },
    ],
  },
  {
    key: "fuel_requests",
    label: "Fuel Requests",
    actions: [
      { key: "view",    label: "View"    },
      { key: "approve", label: "Approve" },
    ],
  },
  {
    key: "gov_contributions",
    label: "Gov Contributions",
    actions: [
      { key: "view",      label: "View"      },
      { key: "configure", label: "Configure" },
    ],
  },
  {
    key: "settings",
    label: "Settings",
    actions: [
      { key: "view",   label: "View"   },
      { key: "manage", label: "Manage" },
    ],
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Default (empty) permissions                                         */
/* ------------------------------------------------------------------ */

export function emptyPermissions(): RolePermissions {
  const modules = Object.fromEntries(
    MODULE_KEYS.map((k) => [k, false]),
  ) as Record<ModuleKey, boolean>;

  return {
    modules,
    sections: {
      employees:         { view: false, create: false, edit: false, delete: false },
      payroll:           { view: false, process: false, approve: false },
      attendance:        { view: false, log: false, approve: false },
      leave_requests:    { view: false, approve: false },
      fuel_requests:     { view: false, approve: false },
      gov_contributions: { view: false, configure: false },
      settings:          { view: false, manage: false },
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Role Templates                                                      */
/* ------------------------------------------------------------------ */

export interface RoleTemplate {
  readonly name:        string;
  readonly description: string;
  readonly permissions: RolePermissions;
}

export const ROLE_TEMPLATES: readonly RoleTemplate[] = [
  {
    name:        "HR Admin",
    description: "Full access to employee management, payroll, attendance, and HR features.",
    permissions: {
      modules: Object.fromEntries(MODULE_KEYS.map((k) => [k, k === "module_hr"])) as Record<ModuleKey, boolean>,
      sections: {
        employees:         { view: true, create: true, edit: true, delete: true },
        payroll:           { view: true, process: true, approve: true },
        attendance:        { view: true, log: true, approve: true },
        leave_requests:    { view: true, approve: true },
        fuel_requests:     { view: true, approve: true },
        gov_contributions: { view: true, configure: true },
        settings:          { view: true, manage: false },
      },
    },
  },
  {
    name:        "Payroll Officer",
    description: "Can view employees and process/approve payroll and contributions.",
    permissions: {
      modules: Object.fromEntries(MODULE_KEYS.map((k) => [k, k === "module_hr"])) as Record<ModuleKey, boolean>,
      sections: {
        employees:         { view: true, create: false, edit: false, delete: false },
        payroll:           { view: true, process: true, approve: true },
        attendance:        { view: true, log: false, approve: false },
        leave_requests:    { view: true, approve: false },
        fuel_requests:     { view: false, approve: false },
        gov_contributions: { view: true, configure: true },
        settings:          { view: false, manage: false },
      },
    },
  },
  {
    name:        "Read Only",
    description: "Can view all sections but cannot create, edit, or approve anything.",
    permissions: {
      modules: Object.fromEntries(MODULE_KEYS.map((k) => [k, false])) as Record<ModuleKey, boolean>,
      sections: {
        employees:         { view: true, create: false, edit: false, delete: false },
        payroll:           { view: true, process: false, approve: false },
        attendance:        { view: true, log: false, approve: false },
        leave_requests:    { view: true, approve: false },
        fuel_requests:     { view: true, approve: false },
        gov_contributions: { view: true, configure: false },
        settings:          { view: false, manage: false },
      },
    },
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Permission summary helper                                           */
/* ------------------------------------------------------------------ */

export function buildPermissionSummary(permissions: RolePermissions): string {
  const parts: string[] = [];

  const { sections, modules } = permissions;

  const enabledModules = (Object.entries(modules) as [ModuleKey, boolean][])
    .filter(([, v]) => v)
    .map(([k]) => k.replace("module_", "").toUpperCase());

  if (enabledModules.length > 0) {
    parts.push(`Access to: ${enabledModules.join(", ")}`);
  }

  if (sections.employees.create || sections.employees.edit) {
    parts.push("can manage Employees");
  } else if (sections.employees.view) {
    parts.push("can view Employees");
  }

  if (sections.payroll.process || sections.payroll.approve) {
    parts.push("can process Payroll");
  } else if (sections.payroll.view) {
    parts.push("can view Payroll");
  }

  if (sections.leave_requests.approve) {
    parts.push("can approve Leaves");
  }

  if (sections.attendance.approve) {
    parts.push("can approve Attendance");
  }

  if (parts.length === 0) return "No permissions assigned yet.";
  return `This role ${parts.slice(1).join(", ")}.`;
}

/* ------------------------------------------------------------------ */
/*  Merge / normalize — ensures all keys exist even on old records     */
/* ------------------------------------------------------------------ */

export function normalizePermissions(raw: unknown): RolePermissions {
  const defaults = emptyPermissions();
  if (!raw || typeof raw !== "object") return defaults;

  const r = raw as Partial<RolePermissions>;

  return {
    modules: { ...defaults.modules, ...(r.modules ?? {}) },
    sections: {
      employees:         { ...defaults.sections.employees,         ...(r.sections?.employees         ?? {}) },
      payroll:           { ...defaults.sections.payroll,           ...(r.sections?.payroll           ?? {}) },
      attendance:        { ...defaults.sections.attendance,        ...(r.sections?.attendance        ?? {}) },
      leave_requests:    { ...defaults.sections.leave_requests,    ...(r.sections?.leave_requests    ?? {}) },
      fuel_requests:     { ...defaults.sections.fuel_requests,     ...(r.sections?.fuel_requests     ?? {}) },
      gov_contributions: { ...defaults.sections.gov_contributions, ...(r.sections?.gov_contributions ?? {}) },
      settings:          { ...defaults.sections.settings,          ...(r.sections?.settings          ?? {}) },
    },
  };
}
