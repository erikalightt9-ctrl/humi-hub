"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2, BookOpen } from "lucide-react";
import { CourseCard } from "@/components/public/CourseCard";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CourseItem {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly durationWeeks: number;
  readonly price: string;
  readonly currency: string | null;
  readonly industry: string | null;
}

interface CoursesApiResponse {
  readonly success: boolean;
  readonly data: ReadonlyArray<CourseItem> | null;
  readonly error: string | null;
}

interface SearchableCourseGridProps {
  readonly initialCourses: ReadonlyArray<CourseItem>;
  /** Pre-selected industry filter (from URL ?industry= param) */
  readonly industry?: string;
  /** Function to resolve a slug → its href */
  readonly resolveHref?: (slug: string) => string;
}

function defaultHref(slug: string): string {
  return `/programs/${slug.toLowerCase().replace(/_/g, "-")}`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function SearchableCourseGrid({
  initialCourses,
  industry,
  resolveHref = defaultHref,
}: SearchableCourseGridProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ReadonlyArray<CourseItem>>(initialCourses);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Reset to initial courses when query is cleared
    if (query.trim() === "") {
      setResults(initialCourses);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);

      try {
        const params = new URLSearchParams({ search: query.trim() });
        if (industry) params.set("industry", industry);

        const res = await fetch(`/api/courses?${params.toString()}`);
        const json = (await res.json()) as CoursesApiResponse;

        if (!res.ok || !json.success || !json.data) {
          setSearchError(json.error ?? "Search failed. Please try again.");
          return;
        }

        setResults(json.data);
      } catch {
        setSearchError("Search failed. Please check your connection.");
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, industry, initialCourses]);

  // Update results when initialCourses change (e.g., SSR re-render)
  useEffect(() => {
    if (query.trim() === "") {
      setResults(initialCourses);
    }
  }, [initialCourses, query]);

  const showEmpty = !isSearching && results.length === 0;

  return (
    <div className="space-y-6">
      {/* Search input */}
      <div className="relative max-w-xl mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by course title or industry…"
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
          aria-label="Search courses"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500 animate-spin" />
        )}
      </div>

      {/* Error */}
      {searchError && (
        <p className="text-center text-sm text-red-600">{searchError}</p>
      )}

      {/* Results count */}
      {query.trim() !== "" && !isSearching && !searchError && (
        <p className="text-center text-sm text-gray-500">
          {results.length === 0
            ? `No courses found for "${query}"`
            : `${results.length} course${results.length !== 1 ? "s" : ""} found for "${query}"`}
        </p>
      )}

      {/* Empty state */}
      {showEmpty && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="bg-gray-100 rounded-full p-4 mb-4">
            <BookOpen className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-700 font-medium">No courses found</p>
          <p className="text-sm text-gray-500 mt-1">
            {query.trim()
              ? `Try a different search term.`
              : `No programs available${industry ? ` for "${industry}"` : ""} yet.`}
          </p>
          {query.trim() && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="mt-4 text-sm text-blue-600 underline hover:text-blue-700"
            >
              Clear search
            </button>
          )}
        </div>
      )}

      {/* Course grid */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {results.map((course) => (
            <CourseCard
              key={course.id}
              title={course.title}
              description={course.description}
              durationWeeks={course.durationWeeks}
              price={course.price}
              currency={course.currency ?? "PHP"}
              slug={course.slug}
              href={resolveHref(course.slug)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
