"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpen, Users, CalendarDays, ChevronRight, Loader2, Plus, Search } from "lucide-react";

type Program = {
  id: string;
  slug: string;
  title: string;
  durationWeeks: number;
  isActive: boolean;
  _count: { schedules: number; enrollments: number };
};

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/courses")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setPrograms(json.data?.courses ?? json.data ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = programs.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Programs</h1>
          <p className="text-sm text-slate-500 mt-0.5">All training courses offered by this center</p>
        </div>
        <Link
          href="/admin/courses/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl font-medium transition-colors"
        >
          <Plus className="h-4 w-4" /> New Program
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search programs…"
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">
            {search ? "No programs match your search" : "No programs yet"}
          </p>
          {!search && (
            <Link
              href="/admin/courses/new"
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="h-4 w-4" /> Create first program
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div key={p.id} className="group rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md hover:border-indigo-200 transition-all">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                  <BookOpen className="h-5 w-5 text-indigo-600" />
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {p.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 leading-snug mb-1">{p.title}</h3>
              <p className="text-xs text-slate-500 mb-4">{p.durationWeeks}-week program</p>

              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {p._count.schedules} {p._count.schedules === 1 ? "batch" : "batches"}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {p._count.enrollments} enrolled
                </span>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                <Link
                  href={`/admin/training-center/schedules?courseId=${p.id}`}
                  className="flex-1 text-center text-xs py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  View Batches
                </Link>
                <Link
                  href={`/admin/courses/${p.slug}`}
                  className="flex items-center gap-1 text-xs py-1.5 px-3 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                >
                  Edit <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
