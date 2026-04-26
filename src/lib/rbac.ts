/**
 * Role-Based Access Control definitions.
 *
 * Three portal roles for admin-portal users (CorporateManager):
 *   ADMIN     – full system access and configuration
 *   EXECUTIVE – read-only view of all operational data
 *   MANAGER   – operational management and approvals
 *
 * Employee portal users (HrEmployee) carry role="employee" and are
 * unaffected by this file.
 */

export type UserRole = "ADMIN" | "EXECUTIVE" | "MANAGER";

export const ROLE_CONFIG: Record<
  UserRole,
  { label: string; description: string; badgeClass: string }
> = {
  ADMIN: {
    label: "Admin",
    description: "Full system access and configuration",
    badgeClass: "bg-blue-500 text-white",
  },
  EXECUTIVE: {
    label: "Executive",
    description: "Read-only view of all operational data",
    badgeClass: "bg-purple-500 text-white",
  },
  MANAGER: {
    label: "Manager",
    description: "Operational management and approvals",
    badgeClass: "bg-emerald-500 text-white",
  },
};

/**
 * Nav paths accessible per role.
 * If a path is not listed here it defaults to ADMIN-only.
 * Prefix matching: "/admin/departments" also covers "/admin/departments/...".
 */
const NAV_ACCESS: Record<string, UserRole[]> = {
  "/admin":                    ["ADMIN", "EXECUTIVE", "MANAGER"],
  "/admin/executive":          ["ADMIN", "EXECUTIVE"],
  "/admin/admin":              ["ADMIN", "MANAGER"],
  "/admin/accounting":         ["ADMIN", "EXECUTIVE", "MANAGER"],
  "/admin/hr":                 ["ADMIN", "EXECUTIVE", "MANAGER"],
  "/admin/operations":         ["ADMIN", "EXECUTIVE", "MANAGER"],
  "/admin/action-center":      ["ADMIN", "MANAGER"],
  "/admin/training-center":    ["ADMIN", "EXECUTIVE", "MANAGER"],
  "/admin/courses":            ["ADMIN", "MANAGER"],
  "/admin/students":           ["ADMIN", "MANAGER"],
  "/admin/trainers":           ["ADMIN"],
  "/admin/enrollees":          ["ADMIN"],
  "/admin/revenue":            ["ADMIN", "EXECUTIVE"],
  "/admin/hr/analytics":       ["ADMIN", "EXECUTIVE", "MANAGER"],
  "/admin/departments":        ["ADMIN", "EXECUTIVE", "MANAGER"],
  "/admin/work":               ["ADMIN", "MANAGER"],
  "/admin/admin/inventory":    ["ADMIN", "MANAGER"],
  "/admin/finance":            ["ADMIN", "EXECUTIVE", "MANAGER"],
  "/admin/sales":              ["ADMIN", "EXECUTIVE", "MANAGER"],
  "/admin/sales/deals":        ["ADMIN", "EXECUTIVE", "MANAGER"],
  "/admin/sales/contacts":     ["ADMIN", "EXECUTIVE", "MANAGER"],
  "/admin/sales/campaigns":    ["ADMIN", "MANAGER"],
  "/admin/sales/activities":   ["ADMIN", "MANAGER"],
  "/admin/sales/tasks":        ["ADMIN", "MANAGER"],
  "/admin/it":                 ["ADMIN", "EXECUTIVE", "MANAGER"],
  "/admin/it/assets":          ["ADMIN", "MANAGER"],
  "/admin/it/requests":        ["ADMIN", "MANAGER"],
  "/admin/users-roles":        ["ADMIN"],
  "/admin/settings":           ["ADMIN"],
};

/** Returns true when the given role is permitted to see a nav path. */
export function canAccessNav(userRole: UserRole | null | undefined, href: string): boolean {
  // Super-admins (no userRole) and ADMIN see everything
  if (!userRole || userRole === "ADMIN") return true;

  // Exact or prefix match — use the longest matching key
  let allowed: UserRole[] | undefined;
  let matchLen = -1;
  for (const [path, roles] of Object.entries(NAV_ACCESS)) {
    if (href === path || href.startsWith(path + "/")) {
      if (path.length > matchLen) {
        matchLen = path.length;
        allowed = roles;
      }
    }
  }
  if (!allowed) return false; // unlisted paths default to ADMIN-only; ADMIN already returned above
  return allowed.includes(userRole);
}

/** Returns the default landing page for a role after login. */
export function defaultLanding(userRole: UserRole | null | undefined): string {
  if (userRole === "EXECUTIVE") return "/admin/executive";
  return "/admin";
}
