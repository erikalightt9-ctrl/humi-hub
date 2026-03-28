"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  Users,
  Clock,
  Loader2,
  ExternalLink,
  GraduationCap,
  Plus,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Course {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly description: string | null;
  readonly thumbnailUrl: string | null;
  readonly tier: string | null;
  readonly duration: number | null;
  readonly status: string;
  readonly enrollmentCount: number;
  readonly trainerName: string | null;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const TIER_COLOR: Record<string, string> = {
  BASIC:        "bg-gray-100 text-gray-600",
  PROFESSIONAL: "bg-blue-100 text-blue-700",
  ENTERPRISE:   "bg-purple-100 text-purple-700",
};

function formatDuration(mins: number | null): string {
  if (!mins) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/* ------------------------------------------------------------------ */
/*  Empty state                                                        */
/* ------------------------------------------------------------------ */

function EmptyState({ query }: { readonly query: string }) {
  return (
    <tr>
      <td colSpan={5}>
        <div className="py-16 text-center">
          <BookOpen className="h-10 w-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500">
            {query ? "No courses match your search" : "No courses available yet"}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {query
              ? "Try adjusting your search or filter"
              : "Your platform admin will add courses here"}
          </p>
        </div>
      </td>
    </tr>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CorporateCoursesPage() {
  const [courses, setCourses] = useState<ReadonlyArray<Course>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("ALL");

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/corporate/courses");
      const json = await r.json();
      if (json.success) setCourses(json.data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const tiers = ["ALL", ...Array.from(new Set(courses.map((c) => c.tier).filter(Boolean) as string[]))];

  const filtered = courses.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      c.title.toLowerCase().includes(q) ||
      (c.description ?? "").toLowerCase().includes(q) ||
      (c.trainerName ?? "").toLowerCase().includes(q);
    const matchTier = tierFilter === "ALL" || c.tier === tierFilter;
    return matchSearch && matchTier;
  });

  return (
    <div className="space-y-6 max-w-6xl">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Courses</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Browse available courses and enroll your team
          </p>
        </div>
        <Link
          href="/corporate/employees"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Enroll Student
        </Link>
      </div>

      {/* ── Search + tier filters ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search courses…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {tiers.map((tier) => (
            <button
              key={tier}
              onClick={() => setTierFilter(tier)}
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                tierFilter === tier
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              }`}
            >
              {tier === "ALL" ? "All Tiers" : tier}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Summary row */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-4 text-xs text-gray-400">
          <span>{filtered.length} of {courses.length} courses</span>
          <span>{courses.reduce((a, c) => a + c.enrollmentCount, 0)} total enrollments</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Course
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">
                  Trainer
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden sm:table-cell">
                  Tier
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Enrolled
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <EmptyState query={search} />
              ) : (
                filtered.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    {/* Title + description */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center shrink-0">
                          <BookOpen className="h-4 w-4 text-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{course.title}</p>
                          {course.duration && (
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3" />
                              {formatDuration(course.duration)}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Trainer */}
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      {course.trainerName ? (
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <GraduationCap className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          <span className="truncate">{course.trainerName}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>

                    {/* Tier */}
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      {course.tier ? (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TIER_COLOR[course.tier] ?? "bg-gray-100 text-gray-600"}`}>
                          {course.tier}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>

                    {/* Enrolled count */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 text-sm text-gray-700">
                        <Users className="h-3.5 w-3.5 text-gray-400" />
                        {course.enrollmentCount}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/corporate/employees`}
                          className="text-xs font-medium bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                        >
                          Enroll Team
                        </Link>
                        <Link
                          href={`/programs/${course.slug}`}
                          target="_blank"
                          className="p-1.5 border border-gray-200 rounded-lg text-gray-400 hover:text-blue-600 hover:border-blue-200 transition-colors"
                          title="Preview course"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
