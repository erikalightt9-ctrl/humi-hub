"use client";

import { useState, useCallback } from "react";
import { Sparkles, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AIAssessment {
  readonly score: number;
  readonly feedback: string;
  readonly strengths: ReadonlyArray<string>;
  readonly improvements: ReadonlyArray<string>;
  readonly skillsAssessed: ReadonlyArray<string>;
}

interface Submission {
  readonly id: string;
  readonly assignmentTitle: string;
  readonly fileName: string;
  readonly status: string;
  readonly grade: number | null;
  readonly maxPoints: number;
  readonly submittedAt: string;
  readonly aiEvaluation: AIAssessment | null;
  readonly aiEvaluatedAt: string | null;
}

interface AIAssessmentCardProps {
  readonly submission: Submission;
}

/* ------------------------------------------------------------------ */
/*  Score color                                                        */
/* ------------------------------------------------------------------ */

function scoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  return "text-red-500";
}

function scoreBg(score: number): string {
  if (score >= 80) return "bg-green-50 border-green-200";
  if (score >= 60) return "bg-yellow-50 border-yellow-200";
  return "bg-red-50 border-red-200";
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AIAssessmentCard({ submission }: AIAssessmentCardProps) {
  const [assessment, setAssessment] = useState<AIAssessment | null>(
    submission.aiEvaluation,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestReview = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/student/submissions/${submission.id}/ai-assess`,
        { method: "POST" },
      );
      const json = await res.json();

      if (json.success) {
        setAssessment(json.data);
      } else {
        setError(json.error ?? "Failed to get AI review");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [submission.id]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      {/* Submission Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-medium text-gray-900">
            {submission.assignmentTitle}
          </h3>
          <p className="text-xs text-gray-500">
            {submission.fileName} · Submitted{" "}
            {new Date(submission.submittedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
            {submission.grade !== null && (
              <> · Grade: {submission.grade}/{submission.maxPoints}</>
            )}
          </p>
        </div>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            submission.status === "GRADED"
              ? "bg-green-100 text-green-700"
              : submission.status === "RETURNED"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-gray-100 text-gray-600"
          }`}
        >
          {submission.status}
        </span>
      </div>

      {/* AI Assessment Results */}
      {assessment ? (
        <div className="space-y-3 mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-semibold text-gray-900">
              AI Assessment
            </span>
          </div>

          {/* Score */}
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${scoreBg(assessment.score)}`}
          >
            <span className="text-xs text-gray-500">AI Score:</span>
            <span className={`text-lg font-bold ${scoreColor(assessment.score)}`}>
              {assessment.score}
            </span>
            <span className="text-xs text-gray-400">/100</span>
          </div>

          {/* Feedback */}
          <p className="text-sm text-gray-600 leading-relaxed">
            {assessment.feedback}
          </p>

          {/* Strengths */}
          {assessment.strengths.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-green-700 mb-1.5">
                Strengths
              </p>
              <div className="flex flex-wrap gap-1.5">
                {assessment.strengths.map((s, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-100"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Improvements */}
          {assessment.improvements.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-orange-700 mb-1.5">
                Areas for Improvement
              </p>
              <div className="flex flex-wrap gap-1.5">
                {assessment.improvements.map((imp, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-full border border-orange-100"
                  >
                    <AlertCircle className="h-3 w-3" />
                    {imp}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Skills Assessed */}
          {assessment.skillsAssessed.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-blue-700 mb-1.5">
                Skills Assessed
              </p>
              <div className="flex flex-wrap gap-1.5">
                {assessment.skillsAssessed.map((skill, i) => (
                  <span
                    key={i}
                    className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-100"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {submission.aiEvaluatedAt && (
            <p className="text-xs text-gray-400 mt-2">
              Evaluated{" "}
              {new Date(submission.aiEvaluatedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>
      ) : (
        /* No assessment yet — show button */
        <div className="mt-3 pt-3 border-t border-gray-100">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-purple-700 border-purple-200 hover:bg-purple-50"
            onClick={handleRequestReview}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {loading ? "Analyzing..." : "Request AI Review"}
          </Button>
          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        </div>
      )}
    </div>
  );
}
