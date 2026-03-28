"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  BookOpen, Search, Users, Clock, Loader2, ExternalLink,
  GraduationCap, ArrowLeft,
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

const TIER_STYLE: Record<string, string> = {
  BASIC:        "bg-ds-surface text-ds-muted border-ds-border",
  PROFESSIONAL: "bg-blue-900/40 text-blue-400 border-blue-800",
  ENTERPRISE:   "bg-purple-900/40 text-purple-400 border-purple-800",
};

function fmtDuration(mins: number | null): string {
  if (!mins) return "—";
  const h = Math.floor(mins / 60), m = mins % 60;
  if (h === 0) return `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CoursesListPage() {
  const [courses, setCourses]       = useState<ReadonlyArray<Course>>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [tierFilter, setTierFilter] = useState("ALL");

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/corporate/courses");
      const json = await r.json();
      if (json.success) setCourses(json.data ?? []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const tiers = ["ALL", ...Array.from(new Set(courses.map((c) => c.tier).filter(Boolean) as string[]))];

  const filtered = courses.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.title.toLowerCase().includes(q) ||
        (c.description ?? "").toLowerCase().includes(q) ||
        (c.trainerName ?? "").toLowerCase().includes(q)) &&
      (tierFilter === "ALL" || c.tier === tierFilter)
    );
  });

  return (
    <div className="space-y-6 max-w-6xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/corporate/courses"
            className="p-2 rounded-xl bg-ds-surface border border-ds-border text-ds-muted hover:text-ds-text hover:border-ds-primary/50 transition-colors"
            title="Back to Courses"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-ds-text">All Courses</h1>
            <p className="text-sm text-ds-muted mt-0.5">Browse and assign courses to your team</p>
          </div>
        </div>
        <Link
          href="/corporate/employees"
          className="flex items-center gap-2 px-4 py-2 bg-ds-primary text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Users className="h-4 w-4" />
          Enroll Student
        </Link>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ds-muted" />
          <input
            type="text"
            placeholder="Search courses…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-ds-surface border border-ds-border text-ds-text placeholder:text-ds-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {tiers.map((tier) => (
            <button
              key={tier}
              onClick={() => setTierFilter(tier)}
              className={`px-3 py-2 text-xs font-medium rounded-xl border transition-colors ${
                tierFilter === tier
                  ? "bg-ds-primary text-white border-ds-primary"
                  : "bg-ds-surface text-ds-muted border-ds-border hover:text-ds-text"
              }`}
            >
              {tier === "ALL" ? "All Tiers" : tier}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-ds-card rounded-xl border border-ds-border overflow-hidden">
        <div className="px-5 py-3 border-b border-ds-border flex items-center gap-4 text-xs text-ds-muted">
          <span>{filtered.length} of {courses.length} courses</span>
          <span>{courses.reduce((a, c) => a + c.enrollmentCount, 0)} total enrollments</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-ds-primary" />
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-ds-surface border-b border-ds-border">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-ds-muted uppercase tracking-wide">Course</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-ds-muted uppercase tracking-wide hidden md:table-cell">Trainer</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-ds-muted uppercase tracking-wide hidden sm:table-cell">Tier</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-ds-muted uppercase tracking-wide">Enrolled</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-ds-muted uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ds-border">
              {filtered.length === 0 ? (
                <tr><td colSpan={5}>
                  <div className="py-16 text-center">
                    <BookOpen className="h-10 w-10 text-ds-muted/20 mx-auto mb-3" />
                    <p className="text-sm font-medium text-ds-muted">
                      {search ? "No courses match your search" : "No courses available yet"}
                    </p>
                    <p className="text-xs text-ds-muted/60 mt-1">
                      {search ? "Try adjusting your search or filter" : "Your platform admin will add courses here"}
                    </p>
                  </div>
                </td></tr>
              ) : filtered.map((course) => (
                <tr key={course.id} className="hover:bg-ds-surface/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-ds-surface flex items-center justify-center shrink-0">
                        <BookOpen className="h-4 w-4 text-ds-muted" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ds-text truncate">{course.title}</p>
                        {course.duration && (
                          <p className="text-xs text-ds-muted flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" />{fmtDuration(course.duration)}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    {course.trainerName ? (
                      <div className="flex items-center gap-1.5 text-sm text-ds-muted">
                        <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{course.trainerName}</span>
                      </div>
                    ) : <span className="text-ds-muted/50 text-sm">—</span>}
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    {course.tier ? (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${TIER_STYLE[course.tier] ?? "bg-ds-surface text-ds-muted border-ds-border"}`}>
                        {course.tier}
                      </span>
                    ) : <span className="text-ds-muted/50 text-sm">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1 text-sm text-ds-text">
                      <Users className="h-3.5 w-3.5 text-ds-muted" />
                      {course.enrollmentCount}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <Link
                        href="/corporate/employees"
                        className="text-xs font-medium bg-ds-primary text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Enroll Team
                      </Link>
                      <Link
                        href={`/programs/${course.slug}`}
                        target="_blank"
                        className="p-1.5 border border-ds-border rounded-lg text-ds-muted hover:text-ds-text hover:border-ds-primary/50 transition-colors"
                        title="Preview"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
