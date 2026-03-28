"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardCheck,
  Download,
  User,
  BookOpen,
  CalendarClock,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SubmissionItem {
  readonly id: string;
  readonly fileName: string;
  readonly filePath: string;
  readonly fileSize: number;
  readonly submittedAt: string;
  readonly student: {
    readonly id: string;
    readonly name: string;
    readonly email: string;
  };
  readonly assignment: {
    readonly id: string;
    readonly title: string;
    readonly maxPoints: number;
    readonly courseTitle: string;
  };
}

interface GradingQueueClientProps {
  readonly submissions: ReadonlyArray<SubmissionItem>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GradingQueueClient({ submissions }: GradingQueueClientProps) {
  const router = useRouter();
  const [selectedSubmission, setSelectedSubmission] =
    useState<SubmissionItem | null>(null);
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openGradeDialog = useCallback((submission: SubmissionItem) => {
    setSelectedSubmission(submission);
    setGrade("");
    setFeedback("");
    setError(null);
  }, []);

  const closeDialog = useCallback(() => {
    setSelectedSubmission(null);
    setGrade("");
    setFeedback("");
    setError(null);
  }, []);

  const handleGradeSubmit = useCallback(async () => {
    if (!selectedSubmission) return;

    const gradeNum = Number(grade);
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 100) {
      setError("Grade must be a number between 0 and 100");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/trainer/submissions/${selectedSubmission.id}/grade`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ grade: gradeNum, feedback }),
        },
      );

      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Failed to grade submission");
        return;
      }

      closeDialog();
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedSubmission, grade, feedback, closeDialog, router]);

  return (
    <>
      {/* Submissions table */}
      <div className="bg-ds-card rounded-xl border border-ds-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ds-surface border-b border-ds-border">
                <th className="text-left px-5 py-3 font-medium text-ds-muted">
                  Student
                </th>
                <th className="text-left px-5 py-3 font-medium text-ds-muted">
                  Assignment
                </th>
                <th className="text-left px-5 py-3 font-medium text-ds-muted">
                  Course
                </th>
                <th className="text-left px-5 py-3 font-medium text-ds-muted">
                  File
                </th>
                <th className="text-left px-5 py-3 font-medium text-ds-muted">
                  Submitted
                </th>
                <th className="text-right px-5 py-3 font-medium text-ds-muted">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ds-border">
              {submissions.map((submission) => (
                <tr key={submission.id} className="hover:bg-ds-surface/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-900/40 rounded-full p-1.5">
                        <User className="h-3.5 w-3.5 text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-ds-text text-xs">
                          {submission.student.name}
                        </p>
                        <p className="text-ds-muted text-xs">
                          {submission.student.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-ds-text text-xs">
                    {submission.assignment.title}
                  </td>
                  <td className="px-5 py-3 text-ds-muted text-xs">
                    {submission.assignment.courseTitle}
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs text-ds-muted">
                      {submission.fileName}
                    </span>
                    <span className="block text-xs text-ds-muted opacity-70">
                      {formatFileSize(submission.fileSize)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-ds-muted text-xs">
                    {formatDate(submission.submittedAt)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button
                      size="sm"
                      variant="default"
                      className="h-8 text-xs"
                      onClick={() => openGradeDialog(submission)}
                    >
                      <ClipboardCheck className="h-3.5 w-3.5 mr-1" />
                      Grade
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grade Dialog */}
      <AlertDialog
        open={selectedSubmission !== null}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Grade Submission</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p className="text-sm text-ds-muted">
                  <strong>Student:</strong>{" "}
                  {selectedSubmission?.student.name}
                </p>
                <p className="text-sm text-ds-muted">
                  <strong>Assignment:</strong>{" "}
                  {selectedSubmission?.assignment.title}
                </p>
                <p className="text-sm text-ds-muted">
                  <strong>File:</strong>{" "}
                  {selectedSubmission?.fileName} (
                  {selectedSubmission
                    ? formatFileSize(selectedSubmission.fileSize)
                    : ""}
                  )
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-2">
            {/* Grade input */}
            <div>
              <label
                htmlFor="grade-input"
                className="block text-sm font-medium text-ds-text mb-1"
              >
                Grade (0-100)
              </label>
              <input
                id="grade-input"
                type="number"
                min={0}
                max={100}
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full bg-ds-surface border border-ds-border rounded-lg px-3 py-2 text-sm text-ds-text placeholder:text-ds-muted focus:outline-none focus:ring-2 focus:ring-ds-primary/50 focus:border-ds-primary/50"
                placeholder="Enter grade..."
              />
            </div>

            {/* Feedback textarea */}
            <div>
              <label
                htmlFor="feedback-input"
                className="block text-sm font-medium text-ds-text mb-1"
              >
                Feedback (optional)
              </label>
              <textarea
                id="feedback-input"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                className="w-full bg-ds-surface border border-ds-border rounded-lg px-3 py-2 text-sm text-ds-text placeholder:text-ds-muted focus:outline-none focus:ring-2 focus:ring-ds-primary/50 focus:border-ds-primary/50 resize-none"
                placeholder="Provide feedback to the student..."
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-900/40 border border-red-800 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <Button
              onClick={handleGradeSubmit}
              disabled={isSubmitting || !grade}
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Grading...
                </>
              ) : (
                "Submit Grade"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
