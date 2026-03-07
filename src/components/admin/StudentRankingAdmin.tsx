"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  Trophy,
  Medal,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface DimensionBreakdown {
  readonly careerReadiness: number;
  readonly quizAverage: number;
  readonly assignmentAverage: number;
  readonly badgesNormalized: number;
  readonly courseProgress: number;
  readonly forumParticipation: number;
}

interface AdminRankedStudent {
  readonly rank: number;
  readonly studentId: string;
  readonly name: string;
  readonly email: string;
  readonly courseTitle: string;
  readonly courseSlug: string;
  readonly compositeScore: number;
  readonly dimensions: DimensionBreakdown;
}

interface ApiResponse {
  readonly success: boolean;
  readonly data: readonly AdminRankedStudent[] | null;
  readonly error: string | null;
}

type SortField =
  | "rank"
  | "name"
  | "email"
  | "courseTitle"
  | "compositeScore"
  | "careerReadiness"
  | "quizAverage"
  | "assignmentAverage"
  | "badgesNormalized"
  | "courseProgress"
  | "forumParticipation";

type SortDirection = "asc" | "desc";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

interface CourseOption {
  readonly value: string;
  readonly label: string;
}

const COURSE_OPTIONS: readonly CourseOption[] = [
  { value: "medical-va", label: "Medical VA" },
  { value: "real-estate-va", label: "Real Estate VA" },
  { value: "us-bookkeeping-va", label: "US Bookkeeping VA" },
] as const;

interface ColumnDef {
  readonly key: SortField;
  readonly label: string;
  readonly shortLabel?: string;
}

const COLUMNS: readonly ColumnDef[] = [
  { key: "rank", label: "Rank" },
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "courseTitle", label: "Course" },
  { key: "compositeScore", label: "Composite" },
  { key: "careerReadiness", label: "Career", shortLabel: "Career" },
  { key: "quizAverage", label: "Quizzes", shortLabel: "Quiz" },
  { key: "assignmentAverage", label: "Assignments", shortLabel: "Assign" },
  { key: "badgesNormalized", label: "Badges", shortLabel: "Badges" },
  { key: "courseProgress", label: "Progress", shortLabel: "Prog" },
  { key: "forumParticipation", label: "Forum", shortLabel: "Forum" },
] as const;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getSortableValue(
  student: AdminRankedStudent,
  field: SortField,
): string | number {
  switch (field) {
    case "rank":
      return student.rank;
    case "name":
      return student.name.toLowerCase();
    case "email":
      return student.email.toLowerCase();
    case "courseTitle":
      return student.courseTitle.toLowerCase();
    case "compositeScore":
      return student.compositeScore;
    case "careerReadiness":
      return student.dimensions.careerReadiness;
    case "quizAverage":
      return student.dimensions.quizAverage;
    case "assignmentAverage":
      return student.dimensions.assignmentAverage;
    case "badgesNormalized":
      return student.dimensions.badgesNormalized;
    case "courseProgress":
      return student.dimensions.courseProgress;
    case "forumParticipation":
      return student.dimensions.forumParticipation;
    default:
      return 0;
  }
}

function getMedalColor(rank: number): string {
  switch (rank) {
    case 1:
      return "text-yellow-500";
    case 2:
      return "text-gray-400";
    case 3:
      return "text-amber-600";
    default:
      return "";
  }
}

function getScoreCellColor(score: number): string {
  if (score >= 80) return "text-green-700 bg-green-50";
  if (score >= 60) return "text-blue-700 bg-blue-50";
  if (score >= 40) return "text-yellow-700 bg-yellow-50";
  return "text-red-600 bg-red-50";
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function StudentRankingAdmin() {
  const [students, setStudents] = useState<readonly AdminRankedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courseFilter, setCourseFilter] = useState("");
  const [sortField, setSortField] = useState<SortField>("rank");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");

  const fetchRanking = useCallback(async (courseSlug: string) => {
    setLoading(true);
    setError(null);

    try {
      const qs = courseSlug ? `?courseSlug=${courseSlug}` : "";
      const res = await fetch(`/api/admin/student-ranking${qs}`);
      const json: ApiResponse = await res.json();

      if (!json.success) {
        setError(json.error ?? "Failed to load ranking");
        setStudents([]);
        return;
      }

      setStudents(json.data ?? []);
    } catch {
      setError("Unable to load ranking. Please try again.");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRanking(courseFilter);
  }, [courseFilter, fetchRanking]);

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDir(field === "name" || field === "email" ? "asc" : "desc");
      }
    },
    [sortField],
  );

  const sortedStudents = useMemo(() => {
    const sorted = [...students].sort((a, b) => {
      const aVal = getSortableValue(a, sortField);
      const bVal = getSortableValue(b, sortField);
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [students, sortField, sortDir]);

  const handleCourseChange = useCallback((value: string) => {
    setCourseFilter(value === "ALL" ? "" : value);
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Trophy className="h-6 w-6 text-blue-600" />
            Student Ranking
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Comprehensive view of all student composite scores and dimension
            breakdowns.
          </p>
        </div>

        {/* Course Filter */}
        <Select
          value={courseFilter || "ALL"}
          onValueChange={handleCourseChange}
        >
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="All Courses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Courses</SelectItem>
            {COURSE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
          <span className="text-gray-500">Loading student ranking...</span>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="text-center py-20">
          <p className="text-red-600 font-medium">{error}</p>
          <button
            type="button"
            onClick={() => fetchRanking(courseFilter)}
            className="mt-4 text-sm text-blue-600 hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && sortedStudents.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
          <p className="text-gray-500">No students found for this filter.</p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && sortedStudents.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap"
                    onClick={() => handleSort(col.key)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.shortLabel ?? col.label}
                      {sortField === col.key ? (
                        sortDir === "asc" ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-30" />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedStudents.map((student) => (
                <tr
                  key={student.studentId}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {/* Rank */}
                  <td className="px-3 py-3 whitespace-nowrap">
                    {student.rank <= 3 ? (
                      <span className="inline-flex items-center gap-1">
                        <Medal
                          className={`h-4 w-4 ${getMedalColor(student.rank)}`}
                        />
                        <span className="text-sm font-bold text-gray-700">
                          {student.rank}
                        </span>
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">
                        {student.rank}
                      </span>
                    )}
                  </td>

                  {/* Name */}
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {student.name}
                    </span>
                  </td>

                  {/* Email */}
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className="text-sm text-gray-500">
                      {student.email}
                    </span>
                  </td>

                  {/* Course */}
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className="text-sm text-gray-600">
                      {student.courseTitle}
                    </span>
                  </td>

                  {/* Composite Score */}
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-sm font-bold ${getScoreCellColor(student.compositeScore)}`}
                    >
                      {student.compositeScore}
                    </span>
                  </td>

                  {/* Dimension Scores */}
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">
                    {student.dimensions.careerReadiness}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">
                    {student.dimensions.quizAverage}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">
                    {student.dimensions.assignmentAverage}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">
                    {student.dimensions.badgesNormalized}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">
                    {student.dimensions.courseProgress}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">
                    {student.dimensions.forumParticipation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Count footer */}
          <div className="border-t border-gray-200 bg-gray-50 px-4 py-2">
            <p className="text-xs text-gray-500">
              Showing {sortedStudents.length}{" "}
              {sortedStudents.length === 1 ? "student" : "students"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
