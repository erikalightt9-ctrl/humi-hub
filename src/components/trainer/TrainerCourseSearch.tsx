"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  BookOpen,
  FileText,
  ClipboardCheck,
  HelpCircle,
  Users,
  ChevronRight,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types (mirror trainer.repository shape)                           */
/* ------------------------------------------------------------------ */

interface CourseCountData {
  readonly lessons: number;
  readonly assignments: number;
  readonly quizzes: number;
}

interface CourseWithStudents {
  readonly id: string;
  readonly title: string;
  readonly studentCount: number;
  readonly _count: CourseCountData;
}

interface TrainerCourseSearchProps {
  readonly courses: ReadonlyArray<CourseWithStudents>;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function TrainerCourseSearch({ courses }: TrainerCourseSearchProps) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? courses.filter((c) =>
        c.title.toLowerCase().includes(query.toLowerCase()),
      )
    : courses;

  return (
    <div className="space-y-5">
      {/* Search input */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search courses…"
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          aria-label="Search courses"
        />
      </div>

      {/* Count */}
      {query.trim() !== "" && (
        <p className="text-sm text-gray-500">
          {filtered.length === 0
            ? `No courses match "${query}"`
            : `${filtered.length} of ${courses.length} course${courses.length !== 1 ? "s" : ""}`}
        </p>
      )}

      {/* Empty search result */}
      {filtered.length === 0 && query.trim() !== "" ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <Search className="h-8 w-8 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-700 font-medium">No courses match your search</p>
          <button
            type="button"
            onClick={() => setQuery("")}
            className="mt-2 text-sm text-blue-600 underline hover:text-blue-700"
          >
            Clear search
          </button>
        </div>
      ) : filtered.length === 0 ? (
        /* No courses at all */
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            No Courses Found
          </h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            You are not assigned to any training schedules yet. Once an admin
            assigns you to a schedule, the course content will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((course) => (
            <Link
              key={course.id}
              href={`/trainer/courses/${course.id}`}
              className="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-200 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="bg-blue-100 rounded-lg p-2.5">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors mt-1" />
              </div>

              <h3 className="font-semibold text-gray-900 text-sm mb-3 line-clamp-2">
                {course.title}
              </h3>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-gray-500">
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  <span>{course._count.lessons} Lessons</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500">
                  <ClipboardCheck className="h-3.5 w-3.5 shrink-0" />
                  <span>{course._count.assignments} Assignments</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500">
                  <HelpCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{course._count.quizzes} Quizzes</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500">
                  <Users className="h-3.5 w-3.5 shrink-0" />
                  <span>{course.studentCount} Students</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
