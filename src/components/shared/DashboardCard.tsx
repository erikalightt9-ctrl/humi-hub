import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DashboardCardProps {
  readonly href: string;
  readonly label: string;
  readonly description?: string;
  readonly icon: React.ComponentType<{ className?: string }>;
  /** Tailwind color classes for the icon background & icon, e.g. "bg-blue-100 text-blue-600" */
  readonly colorClass?: string;
  /** Badge text shown top-right (e.g. a count) */
  readonly badge?: string | number;
  /** Roles allowed to see/click this card. Undefined = visible to all. */
  readonly allowedRoles?: ReadonlyArray<string>;
  /** Current user role — used for gating */
  readonly currentRole?: string;
  /** Mark card as locked (shows lock icon, disables navigation) */
  readonly locked?: boolean;
  /** Optional additional className for the card container */
  readonly className?: string;
}

/**
 * DashboardCard — a clickable navigation card used inside module dashboard hubs.
 * Role-gated: if allowedRoles is set and currentRole is not included, the card is hidden.
 * Immutable props; renders as a Next.js Link for zero-JS navigation.
 */
export function DashboardCard({
  href,
  label,
  description,
  icon: Icon,
  colorClass = "bg-blue-100 text-blue-600",
  badge,
  allowedRoles,
  currentRole,
  locked = false,
  className,
}: DashboardCardProps) {
  // Role-based visibility: hide card if role is not in allowedRoles
  if (allowedRoles && currentRole && !allowedRoles.includes(currentRole)) {
    return null;
  }

  if (locked) {
    return (
      <div
        className={cn(
          "relative flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 p-5 opacity-60 cursor-not-allowed",
          className
        )}
        aria-disabled="true"
      >
        <_CardInner
          Icon={Icon}
          colorClass={colorClass}
          badge={badge}
          label={label}
          description={description}
          locked
        />
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5",
        "hover:border-blue-300 hover:shadow-md transition-all duration-200",
        className
      )}
    >
      <_CardInner
        Icon={Icon}
        colorClass={colorClass}
        badge={badge}
        label={label}
        description={description}
      />
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Internal: shared card body (avoids duplication between locked / linked states)
// ---------------------------------------------------------------------------

interface CardInnerProps {
  readonly Icon: React.ComponentType<{ className?: string }>;
  readonly colorClass: string;
  readonly badge?: string | number;
  readonly label: string;
  readonly description?: string;
  readonly locked?: boolean;
}

function _CardInner({ Icon, colorClass, badge, label, description, locked }: CardInnerProps) {
  return (
    <>
      {/* Top row: icon + optional badge */}
      <div className="flex items-start justify-between">
        <div className={cn("rounded-lg p-2.5 shrink-0", colorClass)}>
          <Icon className="h-5 w-5" />
        </div>

        <div className="flex items-center gap-2">
          {badge !== undefined && (
            <span className="text-xs font-semibold bg-blue-600 text-white rounded-full px-2 py-0.5 min-w-[1.5rem] text-center">
              {badge}
            </span>
          )}
          {locked ? (
            <Lock className="h-4 w-4 text-gray-400" />
          ) : (
            <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all duration-150" />
          )}
        </div>
      </div>

      {/* Label + description */}
      <div>
        <p className="text-sm font-semibold text-gray-900 leading-tight">{label}</p>
        {description && (
          <p className="text-xs text-gray-500 mt-0.5 leading-snug line-clamp-2">{description}</p>
        )}
      </div>
    </>
  );
}
