"use client";

import { useState, useCallback } from "react";
import {
  BookOpen,
  ClipboardCheck,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StudentRow {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly fullName: string;
  readonly courseTitle: string;
  readonly completionCount: number;
  readonly submissionCount: number;
}

interface LessonProgress {
  readonly completed: number;
  readonly total: number;
  readonly percent: number;
}

interface SubmissionDetail {
  readonly id: string;
  readonly assignmentTitle: string;
  readonly maxPoints: number;
  readonly status: string;
  readonly grade: number | null;
  readonly submittedAt: string;
  readonly gradedAt: string | null;
}

interface QuizAttemptDetail {
  readonly id: string;
  readonly quizTitle: string;
  readonly score: number;
  readonly passed: boolean;
  readonly passingScore: number;
  readonly completedAt: string;
}

interface StudentProgress {
  readonly courseName: string;
  readonly lessonProgress: LessonProgress;
  readonly submissions: ReadonlyArray<SubmissionDetail>;
  readonly quizAttempts: ReadonlyArray<QuizAttemptDetail>;
}

interface StudentProgressTableProps {
  readonly students: ReadonlyArray<StudentRow>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StudentProgressTable({ students }: StudentProgressTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [progressData, setProgressData] = useState<Record<string, StudentProgress>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const toggleExpand = useCallback(
    async (studentId: string) => {
      if (expandedId === studentId) {
        setExpandedId(null);
        return;
      }

      setExpandedId(studentId);

      // Fetch progress if not cached
      if (!progressData[studentId]) {
        setLoadingId(studentId);
        try {
          const res = await fetch(
            `/api/trainer/students/${studentId}/progress`,
          );
          const json = await res.json();
          if (json.success) {
            setProgressData((prev) => ({
              ...prev,
              [studentId]: json.data,
            }));
          }
        } catch {
          // Silently handle — user sees empty state
        } finally {
          setLoadingId(null);
        }
      }
    },
    [expandedId, progressData],
  );

  return (
    <div className="bg-ds-card rounded-xl border border-ds-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ds-border bg-ds-surface">
              <th className="w-8 px-3 py-3" />
              <th className="text-left px-5 py-3 font-medium text-ds-muted">
                Name
              </th>
              <th className="text-left px-5 py-3 font-medium text-ds-muted">
                Email
              </th>
              <th className="text-left px-5 py-3 font-medium text-ds-muted">
                Course
              </th>
              <th className="text-center px-5 py-3 font-medium text-ds-muted">
                <span className="inline-flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  Lessons
                </span>
              </th>
              <th className="text-center px-5 py-3 font-medium text-ds-muted">
                <span className="inline-flex items-center gap-1">
                  <ClipboardCheck className="h-3.5 w-3.5" />
                  Submissions
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ds-border">
            {students.map((student) => {
              const isExpanded = expandedId === student.id;
              const isLoading = loadingId === student.id;
              const progress = progressData[student.id];

              return (
                <StudentRowGroup
                  key={student.id}
                  student={student}
                  isExpanded={isExpanded}
                  isLoading={isLoading}
                  progress={progress}
                  onToggle={() => toggleExpand(student.id)}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 border-t border-ds-border text-xs text-ds-muted">
        {students.length} student{students.length !== 1 ? "s" : ""} total
        &middot; Click a row to view detailed progress
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Row + expandable detail
// ---------------------------------------------------------------------------

function StudentRowGroup({
  student,
  isExpanded,
  isLoading,
  progress,
  onToggle,
}: {
  readonly student: StudentRow;
  readonly isExpanded: boolean;
  readonly isLoading: boolean;
  readonly progress: StudentProgress | undefined;
  readonly onToggle: () => void;
}) {
  return (
    <>
      <tr
        className="hover:bg-ds-surface/50 transition-colors cursor-pointer"
        onClick={onToggle}
      >
        <td className="px-3 py-3 text-ds-muted">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </td>
        <td className="px-5 py-3 font-medium text-ds-text">
          {student.fullName}
        </td>
        <td className="px-5 py-3 text-ds-muted">{student.email}</td>
        <td className="px-5 py-3 text-ds-text">{student.courseTitle}</td>
        <td className="px-5 py-3 text-center text-ds-text">
          {student.completionCount}
        </td>
        <td className="px-5 py-3 text-center text-ds-text">
          {student.submissionCount}
        </td>
      </tr>

      {isExpanded && (
        <tr>
          <td colSpan={6} className="px-5 py-4 bg-ds-surface/50">
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                <span className="ml-2 text-sm text-ds-muted">
                  Loading progress...
                </span>
              </div>
            ) : progress ? (
              <ProgressDetail progress={progress} />
            ) : (
              <p className="text-sm text-ds-muted text-center py-4">
                Unable to load progress data.
              </p>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Expanded progress details
// ---------------------------------------------------------------------------

function ProgressDetail({
  progress,
}: {
  readonly progress: StudentProgress;
}) {
  return (
    <div className="space-y-5">
      {/* Lesson Progress */}
      <div>
        <h4 className="text-xs font-semibold text-ds-muted uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5" />
          Lesson Progress
        </h4>
        <div className="bg-ds-card rounded-lg border border-ds-border p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-ds-muted">
              {progress.lessonProgress.completed} /{" "}
              {progress.lessonProgress.total} lessons completed
            </span>
            <span className="text-xs font-semibold text-ds-text">
              {progress.lessonProgress.percent}%
            </span>
          </div>
          <div className="w-full bg-ds-surface rounded-full h-2">
            <div
              className={cn(
                "h-2 rounded-full transition-all",
                progress.lessonProgress.percent >= 100
                  ? "bg-emerald-500"
                  : progress.lessonProgress.percent >= 50
                    ? "bg-blue-500"
                    : "bg-amber-500",
              )}
              style={{
                width: `${Math.min(progress.lessonProgress.percent, 100)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Assignment Grades */}
      {progress.submissions.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-ds-muted uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <ClipboardCheck className="h-3.5 w-3.5" />
            Assignment Grades
          </h4>
          <div className="bg-ds-card rounded-lg border border-ds-border divide-y divide-ds-border">
            {progress.submissions.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between px-3 py-2"
              >
                <span className="text-xs text-ds-text">
                  {sub.assignmentTitle}
                </span>
                <div className="flex items-center gap-2">
                  {sub.status === "GRADED" ? (
                    <span
                      className={cn(
                        "text-xs font-semibold px-2 py-0.5 rounded-full border",
                        (sub.grade ?? 0) >= 70
                          ? "bg-emerald-900/40 text-emerald-400 border-emerald-800"
                          : "bg-red-900/40 text-red-400 border-red-800",
                      )}
                    >
                      {sub.grade}/{sub.maxPoints}
                    </span>
                  ) : sub.status === "PENDING" ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-900/40 text-amber-400 border border-amber-800 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Pending
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-ds-surface text-ds-muted border border-ds-border">
                      {sub.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quiz Scores */}
      {progress.quizAttempts.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-ds-muted uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <HelpCircle className="h-3.5 w-3.5" />
            Quiz Scores
          </h4>
          <div className="bg-ds-card rounded-lg border border-ds-border divide-y divide-ds-border">
            {progress.quizAttempts.map((attempt) => (
              <div
                key={attempt.id}
                className="flex items-center justify-between px-3 py-2"
              >
                <div>
                  <span className="text-xs text-ds-text">
                    {attempt.quizTitle}
                  </span>
                  <span className="text-xs text-ds-muted ml-2">
                    {formatDate(attempt.completedAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      attempt.passed ? "text-emerald-400" : "text-red-400",
                    )}
                  >
                    {attempt.score}%
                  </span>
                  {attempt.passed ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-red-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {progress.submissions.length === 0 &&
        progress.quizAttempts.length === 0 && (
          <p className="text-xs text-ds-muted text-center py-2">
            No assignment submissions or quiz attempts yet.
          </p>
        )}
    </div>
  );
}
