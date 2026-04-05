/**
 * Central module definitions for the multi-tenant SaaS platform.
 * Each module maps to a TenantFeatureFlag key (`module_*`).
 *
 * Industries map to a preset module bundle for faster onboarding.
 * Super admin can override any module toggle after auto-assignment.
 */

/* ------------------------------------------------------------------ */
/*  Industries                                                          */
/* ------------------------------------------------------------------ */

export const INDUSTRY_KEYS = [
  "training_center",
  "corporate",
  "agency",
  "retail_sales",
  "others",
] as const;

export type IndustryKey = (typeof INDUSTRY_KEYS)[number];

export interface IndustryDefinition {
  key: IndustryKey;
  label: string;
  description: string;
  iconName: string;
  color: string;
  /** Modules auto-enabled for this industry */
  defaultModules: ModuleKey[];
}

// Forward-declare ModuleKey so it can be referenced below
type ModuleKey =
  | "module_lms"
  | "module_hr"
  | "module_accounting"
  | "module_marketing"
  | "module_inventory"
  | "module_sales"
  | "module_it";

export const MODULE_KEYS = [
  "module_lms",
  "module_hr",
  "module_accounting",
  "module_marketing",
  "module_inventory",
  "module_sales",
  "module_it",
] as const;

export type ModuleKey = (typeof MODULE_KEYS)[number];

export interface ModuleNavItem {
  href: string;
  label: string;
  exact?: boolean;
}

export interface ModuleDefinition {
  key: ModuleKey;
  label: string;
  description: string;
  /** Lucide icon name string — resolved in UI components */
  iconName: string;
  color: string;
  /** Badge color class for the superadmin toggle grid */
  badge: string;
  /**
   * LMS is default-enabled for backward compatibility.
   * All other modules are opt-in (default false).
   */
  defaultEnabled: boolean;
  navItems: ModuleNavItem[];
}

export const MODULES: Record<ModuleKey, ModuleDefinition> = {
  module_lms: {
    key: "module_lms",
    label: "LMS",
    description: "Learning Management System — courses, students, trainers, enrollment.",
    iconName: "GraduationCap",
    color: "blue",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    defaultEnabled: true,
    navItems: [
      { href: "/admin/courses", label: "Courses" },
      { href: "/admin/students", label: "Students" },
      { href: "/admin/trainers", label: "Trainers" },
      { href: "/admin/enrollees", label: "Tasks" },
      { href: "/admin/revenue", label: "Revenue" },
    ],
  },
  module_hr: {
    key: "module_hr",
    label: "HR",
    description: "Human Resources — employee records, payroll, attendance, leave management.",
    iconName: "Users",
    color: "violet",
    badge: "bg-violet-100 text-violet-700 border-violet-200",
    defaultEnabled: false,
    navItems: [{ href: "/admin/hr", label: "HR" }],
  },
  module_accounting: {
    key: "module_accounting",
    label: "Accounting",
    description: "Accounting — invoices, expenses, financial reports, tax management.",
    iconName: "Landmark",
    color: "emerald",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    defaultEnabled: false,
    navItems: [
      { href: "/admin/accounting",              label: "Dashboard"       },
      { href: "/admin/accounting/accounts",     label: "Chart of Accounts" },
      { href: "/admin/accounting/transactions", label: "Journal Entries" },
      { href: "/admin/accounting/invoices",     label: "Invoices"        },
      { href: "/admin/accounting/expenses",     label: "Expenses"        },
      { href: "/admin/accounting/bank",         label: "Bank"            },
      { href: "/admin/accounting/reports",      label: "Reports"         },
      { href: "/admin/accounting/audit",        label: "Audit & Forensic"},
    ],
  },
  module_marketing: {
    key: "module_marketing",
    label: "Marketing",
    description: "Marketing — campaigns, leads, email automation, analytics.",
    iconName: "Megaphone",
    color: "pink",
    badge: "bg-pink-100 text-pink-700 border-pink-200",
    defaultEnabled: false,
    navItems: [{ href: "/admin/marketing", label: "Marketing" }],
  },
  module_inventory: {
    key: "module_inventory",
    label: "Inventory",
    description: "Inventory — stock management, warehouses, purchase orders.",
    iconName: "Package",
    color: "amber",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    defaultEnabled: false,
    navItems: [{ href: "/admin/inventory", label: "Inventory" }],
  },
  module_sales: {
    key: "module_sales",
    label: "Sales",
    description: "Sales — CRM, pipeline, quotes, deals, customer management.",
    iconName: "TrendingUp",
    color: "orange",
    badge: "bg-orange-100 text-orange-700 border-orange-200",
    defaultEnabled: false,
    navItems: [{ href: "/admin/sales", label: "Sales" }],
  },
  module_it: {
    key: "module_it",
    label: "IT",
    description: "IT Management — asset tracking, help desk, software licenses.",
    iconName: "Monitor",
    color: "slate",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    defaultEnabled: false,
    navItems: [{ href: "/admin/it", label: "IT" }],
  },
};

export const MODULE_LIST = MODULE_KEYS.map((k) => MODULES[k]);

/**
 * Returns an enabled-module map for a tenant given raw DB flags.
 * Falls back to `defaultEnabled` when no DB record exists.
 */
export function resolveEnabledModules(
  dbFlags: { feature: string; enabled: boolean }[]
): Record<ModuleKey, boolean> {
  const flagMap = new Map(dbFlags.map((f) => [f.feature, f.enabled]));
  return Object.fromEntries(
    MODULE_KEYS.map((key) => [
      key,
      flagMap.has(key) ? (flagMap.get(key) as boolean) : MODULES[key].defaultEnabled,
    ])
  ) as Record<ModuleKey, boolean>;
}

/**
 * Returns the flat list of nav hrefs visible to a tenant
 * given their enabled module map.
 */
export function getEnabledNavHrefs(enabledMap: Record<ModuleKey, boolean>): string[] {
  return MODULE_KEYS.filter((k) => enabledMap[k]).flatMap((k) =>
    MODULES[k].navItems.map((n) => n.href)
  );
}

/* ------------------------------------------------------------------ */
/*  Industry definitions                                                */
/* ------------------------------------------------------------------ */

export const INDUSTRIES: Record<IndustryKey, IndustryDefinition> = {
  training_center: {
    key: "training_center",
    label: "Training Center",
    description: "Online/offline courses, certifications, and student management.",
    iconName: "GraduationCap",
    color: "blue",
    defaultModules: ["module_lms"],
  },
  corporate: {
    key: "corporate",
    label: "Corporate / Office",
    description: "Internal training, HR workflows, and financial management.",
    iconName: "Building2",
    color: "indigo",
    defaultModules: ["module_lms", "module_hr", "module_accounting"],
  },
  agency: {
    key: "agency",
    label: "Agency",
    description: "Client-facing training, lead management, and sales pipelines.",
    iconName: "Megaphone",
    color: "pink",
    defaultModules: ["module_lms", "module_marketing", "module_sales"],
  },
  retail_sales: {
    key: "retail_sales",
    label: "Retail / Sales",
    description: "Inventory control, sales tracking, and financial oversight.",
    iconName: "ShoppingBag",
    color: "amber",
    defaultModules: ["module_inventory", "module_sales", "module_accounting"],
  },
  others: {
    key: "others",
    label: "Others",
    description: "General purpose — start with LMS and add modules as needed.",
    iconName: "LayoutGrid",
    color: "slate",
    defaultModules: ["module_lms"],
  },
};

export const INDUSTRY_LIST = INDUSTRY_KEYS.map((k) => INDUSTRIES[k]);

/**
 * Returns the initial module enable map for a given industry.
 * All unassigned modules default to false.
 */
export function getModulesByIndustry(industry: IndustryKey): Record<ModuleKey, boolean> {
  const preset = INDUSTRIES[industry]?.defaultModules ?? ["module_lms"];
  return Object.fromEntries(
    MODULE_KEYS.map((k) => [k, preset.includes(k)])
  ) as Record<ModuleKey, boolean>;
}
