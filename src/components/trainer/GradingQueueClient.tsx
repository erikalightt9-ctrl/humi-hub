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
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 font-medium text-gray-600">
                  Student
                </th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">
                  Assignment
                </th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">
                  Course
                </th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">
                  File
                </th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">
                  Submitted
                </th>
                <th className="text-right px-5 py-3 font-medium text-gray-600">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {submissions.map((submission) => (
                <tr key={submission.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-100 rounded-full p-1.5">
                        <User className="h-3.5 w-3.5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-xs">
                          {submission.student.name}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {submission.student.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-700 text-xs">
                    {submission.assignment.title}
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {submission.assignment.courseTitle}
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs text-gray-500">
                      {submission.fileName}
                    </span>
                    <span className="block text-xs text-gray-400">
                      {formatFileSize(submission.fileSize)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
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
                <p className="text-sm text-gray-600">
                  <strong>Student:</strong>{" "}
                  {selectedSubmission?.student.name}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Assignment:</strong>{" "}
                  {selectedSubmission?.assignment.title}
                </p>
                <p className="text-sm text-gray-600">
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
                className="block text-sm font-medium text-gray-700 mb-1"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter grade..."
              />
            </div>

            {/* Feedback textarea */}
            <div>
              <label
                htmlFor="feedback-input"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Feedback (optional)
              </label>
              <textarea
                id="feedback-input"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="Provide feedback to the student..."
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
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
