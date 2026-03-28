"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ActiveStudentRow {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly courseTitle: string;
  readonly courseId: string;
  readonly enrolledAt: string;
  readonly progressPercent: number;
  readonly quizAverage: number;
  readonly assignmentsSubmitted: number;
  readonly totalPoints: number;
  readonly lastActive: string | null;
  readonly isClockedIn: boolean;
}

interface PaginatedStudents {
  readonly data: ReadonlyArray<ActiveStudentRow>;
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}

interface CourseOption {
  readonly id: string;
  readonly title: string;
}

interface ActiveStudentsTableProps {
  readonly courses: ReadonlyArray<CourseOption>;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function ProgressBar({ percent }: { readonly percent: number }) {
  const color =
    percent >= 75
      ? "bg-green-500"
      : percent >= 40
        ? "bg-yellow-500"
        : "bg-red-400";

  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-2 bg-ds-surface rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <span className="text-xs text-ds-muted font-medium">{percent}%</span>
    </div>
  );
}

function formatRelativeDate(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ActiveStudentsTable({ courses }: ActiveStudentsTableProps) {
  const router = useRouter();
  const [result, setResult] = useState<PaginatedStudents | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const fetchStudents = useCallback(
    async (showRefreshing = false) => {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);

      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (courseFilter !== "ALL") params.set("courseId", courseFilter);
        params.set("page", String(page));

        const res = await fetch(`/api/admin/students?${params.toString()}`);
        const json = await res.json();
        if (json.success) setResult(json.data);
      } catch {
        /* silent */
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search, courseFilter, page],
  );

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchStudents();
    }, 300);
    return () => clearTimeout(debounce);
  }, [fetchStudents]);

  /* Reset page on filter change */
  useEffect(() => {
    setPage(1);
  }, [search, courseFilter]);

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ds-muted" />
          <Input
            placeholder="Search student name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="All Courses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Courses</SelectItem>
            {courses.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant="outline"
          onClick={() => fetchStudents(true)}
          disabled={refreshing}
          className="gap-1.5"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-ds-muted" />
        </div>
      )}

      {/* Table */}
      {!loading && result && (
        <>
          <div className="rounded-xl border border-ds-border overflow-hidden">
            <Table>
              <TableHeader className="bg-ds-surface border-b border-ds-border">
                <TableRow>
                  <TableHead className="w-[180px] text-ds-muted">Student</TableHead>
                  <TableHead className="text-ds-muted">Course</TableHead>
                  <TableHead className="text-ds-muted">Progress</TableHead>
                  <TableHead className="text-center text-ds-muted">Quiz Avg</TableHead>
                  <TableHead className="text-center text-ds-muted">Assignments</TableHead>
                  <TableHead className="text-center text-ds-muted">Points</TableHead>
                  <TableHead className="text-ds-muted">Last Active</TableHead>
                  <TableHead className="text-ds-muted">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.data.length > 0 ? (
                  result.data.map((s) => (
                    <TableRow
                      key={s.id}
                      className="hover:bg-ds-surface/50 cursor-pointer"
                      onClick={() => router.push(`/admin/students/${s.id}`)}
                    >
                      <TableCell>
                        <p className="font-medium text-ds-text text-sm">
                          {s.name}
                        </p>
                        <p className="text-xs text-ds-muted">{s.email}</p>
                      </TableCell>
                      <TableCell className="text-sm text-ds-muted">
                        {s.courseTitle}
                      </TableCell>
                      <TableCell>
                        <ProgressBar percent={s.progressPercent} />
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`text-sm font-semibold ${
                            s.quizAverage >= 80
                              ? "text-green-400"
                              : s.quizAverage >= 60
                                ? "text-yellow-400"
                                : "text-ds-muted"
                          }`}
                        >
                          {s.quizAverage > 0 ? `${s.quizAverage}%` : "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-sm text-ds-muted">
                        {s.assignmentsSubmitted}
                      </TableCell>
                      <TableCell className="text-center text-sm font-medium text-ds-text">
                        {s.totalPoints.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm text-ds-muted">
                        {formatRelativeDate(s.lastActive)}
                      </TableCell>
                      <TableCell>
                        {s.isClockedIn ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-900/40 border border-emerald-800 rounded-full px-2.5 py-0.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Present
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ds-muted bg-ds-surface border border-ds-border rounded-full px-2.5 py-0.5">
                            Offline
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-12 text-ds-muted"
                    >
                      No active students found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {result.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-ds-muted">
                Showing{" "}
                {Math.min((result.page - 1) * result.limit + 1, result.total)}–
                {Math.min(result.page * result.limit, result.total)} of{" "}
                {result.total} students
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-ds-muted">
                  {result.page} / {result.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= result.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
