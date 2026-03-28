import Link from "next/link";
import {
  Stethoscope,
  Home,
  Calculator,
  Scale,
  Monitor,
  ShoppingCart,
  Building2,
  Headphones,
  GraduationCap,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CourseForBrowse {
  readonly industry: string | null;
  readonly slug: string;
}

interface BrowseByIndustrySectionProps {
  readonly courses: readonly CourseForBrowse[];
}

interface IndustryGroup {
  readonly industry: string;
  readonly count: number;
  readonly icon: LucideIcon;
  readonly color: string;
  readonly iconBg: string;
  readonly iconColor: string;
}

/* ------------------------------------------------------------------ */
/*  Industry → icon/color map                                          */
/* ------------------------------------------------------------------ */

const INDUSTRY_ICON_MAP: ReadonlyArray<{
  readonly keywords: ReadonlyArray<string>;
  readonly icon: LucideIcon;
  readonly color: string;
  readonly iconBg: string;
  readonly iconColor: string;
}> = [
  {
    keywords: ["HEALTH", "MEDICAL", "HEALTHCARE"],
    icon: Stethoscope,
    color: "bg-red-50 border-red-200 hover:border-red-300",
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
  },
  {
    keywords: ["REAL_ESTATE", "REALESTATE", "REAL ESTATE"],
    icon: Home,
    color: "bg-emerald-50 border-emerald-200 hover:border-emerald-300",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  {
    keywords: ["FINANCE", "BOOKKEEPING", "ACCOUNTING"],
    icon: Calculator,
    color: "bg-blue-50 border-blue-200 hover:border-blue-300",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    keywords: ["LEGAL", "COMPLIANCE", "LAW"],
    icon: Scale,
    color: "bg-purple-50 border-purple-200 hover:border-purple-300",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  {
    keywords: ["TECH", "TECHNOLOGY", "IT", "SOFTWARE"],
    icon: Monitor,
    color: "bg-cyan-50 border-cyan-200 hover:border-cyan-300",
    iconBg: "bg-cyan-100",
    iconColor: "text-cyan-600",
  },
  {
    keywords: ["ECOMMERCE", "E-COMMERCE", "E_COMMERCE", "RETAIL"],
    icon: ShoppingCart,
    color: "bg-amber-50 border-amber-200 hover:border-amber-300",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    keywords: ["BUSINESS", "EXECUTIVE"],
    icon: Building2,
    color: "bg-slate-50 border-slate-200 hover:border-slate-300",
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
  },
  {
    keywords: ["CUSTOMER", "SUPPORT"],
    icon: Headphones,
    color: "bg-pink-50 border-pink-200 hover:border-pink-300",
    iconBg: "bg-pink-100",
    iconColor: "text-pink-600",
  },
];

function getIndustryStyle(industry: string) {
  const upper = industry.toUpperCase();
  const match = INDUSTRY_ICON_MAP.find(({ keywords }) =>
    keywords.some((kw) => upper.includes(kw)),
  );
  return match ?? {
    icon: GraduationCap,
    color: "bg-gray-50 border-gray-200 hover:border-gray-300",
    iconBg: "bg-gray-100",
    iconColor: "text-gray-600",
  };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function BrowseByIndustrySection({ courses }: BrowseByIndustrySectionProps) {
  // Group courses by industry, fall back to "Other" for untagged
  const groupMap = new Map<string, number>();
  for (const course of courses) {
    const key = course.industry?.trim() || "Other";
    groupMap.set(key, (groupMap.get(key) ?? 0) + 1);
  }

  const groups: ReadonlyArray<IndustryGroup> = Array.from(groupMap.entries())
    .sort(([a], [b]) => (a === "Other" ? 1 : b === "Other" ? -1 : a.localeCompare(b)))
    .map(([industry, count]) => {
      const style = getIndustryStyle(industry);
      return { industry, count, ...style };
    });

  if (groups.length === 0) return null;

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-blue-600 font-semibold text-sm uppercase tracking-wide mb-2">
            Multi-Industry Platform
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
            Browse by <span className="text-blue-700">Industry</span>
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Find specialized training programs tailored to your field.
          </p>
        </div>

        {/* Industry grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {groups.map(({ industry, count, icon: Icon, color, iconBg, iconColor }) => (
            <Link
              key={industry}
              href={`/programs?industry=${encodeURIComponent(industry)}`}
              className={`flex flex-col items-center gap-3 rounded-xl border-2 p-5 text-center transition-all ${color} group`}
            >
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconBg}`}>
                <Icon className={`h-6 w-6 ${iconColor}`} />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm leading-tight">{industry}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {count} {count === 1 ? "course" : "courses"}
                </p>
              </div>
              <span className={`text-xs font-medium flex items-center gap-1 ${iconColor}`}>
                Explore <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
