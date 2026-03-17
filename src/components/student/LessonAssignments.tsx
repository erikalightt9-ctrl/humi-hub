"use client";

import { useState, useEffect, useRef } from "react";

interface Submission {
  id: string;
  status: string;
  grade?: number | null;
  feedback?: string | null;
  fileName?: string | null;
  linkUrl?: string | null;
  taskCompleted?: boolean | null;
  submittedAt: string;
}

interface Assignment {
  id: string;
  title: string;
  description?: string | null;
  instructions: string;
  submissionType: string;
  dueDate?: string | null;
  maxPoints: number;
  passingScore: number;
  isRequired: boolean;
  allowResubmission: boolean;
  rubric?: Array<{ criterion: string; maxPoints: number; description?: string }> | null;
  submission: Submission | null;
}

interface LessonAssignmentsProps {
  lessonId: string;
}

const TYPE_CONFIG = {
  FILE_UPLOAD: {
    label: "File Upload",
    icon: "📎",
    placeholder: "Upload your file (PDF, DOCX, XLSX, image)",
  },
  TEXT_RESPONSE: {
    label: "Written Response",
    icon: "✏️",
    placeholder: "Type your answer here...",
  },
  EXTERNAL_LINK: {
    label: "External Link",
    icon: "🔗",
    placeholder: "https://docs.google.com/...",
  },
  TASK_COMPLETION: {
    label: "Task Completion",
    icon: "✅",
    placeholder: "",
  },
};

export default function LessonAssignments({ lessonId }: LessonAssignmentsProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [linkUrls, setLinkUrls] = useState<Record<string, string>>({});
  const [error, setError] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<Record<string, boolean>>({});
  const [expandedInstructions, setExpandedInstructions] = useState<Record<string, boolean>>({});
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  async function load() {
    try {
      const res = await fetch(`/api/student/lessons/${lessonId}/assignments`);
      const data = await res.json();
      if (data.success) setAssignments(data.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [lessonId]);

  async function submitFile(assignmentId: string, file: File) {
    setSubmitting(assignmentId);
    setError((e) => ({ ...e, [assignmentId]: "" }));
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`/api/student/assignments/${assignmentId}/submit`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setSuccess((s) => ({ ...s, [assignmentId]: true }));
        load();
      } else {
        setError((e) => ({ ...e, [assignmentId]: data.error ?? "Upload failed" }));
      }
    } catch {
      setError((e) => ({ ...e, [assignmentId]: "Network error" }));
    } finally {
      setSubmitting(null);
    }
  }

  async function submitJson(assignmentId: string, body: object) {
    setSubmitting(assignmentId);
    setError((e) => ({ ...e, [assignmentId]: "" }));
    try {
      const res = await fetch(`/api/student/assignments/${assignmentId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess((s) => ({ ...s, [assignmentId]: true }));
        load();
      } else {
        setError((e) => ({ ...e, [assignmentId]: data.error ?? "Submission failed" }));
      }
    } catch {
      setError((e) => ({ ...e, [assignmentId]: "Network error" }));
    } finally {
      setSubmitting(null);
    }
  }

  if (loading) return null;
  if (assignments.length === 0) return null;

  return (
    <div className="mt-8 space-y-4">
      <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
        <span>📋</span> Assignments
      </h2>

      {assignments.map((a) => {
        const typeConfig = TYPE_CONFIG[a.submissionType as keyof typeof TYPE_CONFIG];
        const hasSubmission = !!a.submission;
        const isGraded = a.submission?.status === "GRADED";
        const isPending = a.submission?.status === "PENDING";
        const isOverdue = a.dueDate && !hasSubmission && new Date(a.dueDate) < new Date();
        const passed = isGraded && a.submission?.grade != null
          && a.submission.grade >= a.passingScore;

        return (
          <div
            key={a.id}
            className={`rounded-xl border-2 p-5 transition-all ${
              isGraded
                ? passed
                  ? "border-green-200 bg-green-50/30"
                  : "border-red-200 bg-red-50/30"
                : isPending
                ? "border-yellow-200 bg-yellow-50/30"
                : isOverdue
                ? "border-red-200 bg-red-50/20"
                : "border-gray-200 bg-white"
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg">{typeConfig?.icon}</span>
                  <h3 className="font-semibold text-gray-900">{a.title}</h3>
                  {a.isRequired && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                      Required
                    </span>
                  )}
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    {typeConfig?.label}
                  </span>
                </div>
                {a.description && (
                  <p className="text-sm text-gray-500 mt-1">{a.description}</p>
                )}
                <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                  <span>{a.maxPoints} pts (pass: {a.passingScore})</span>
                  {a.dueDate && (
                    <span className={isOverdue ? "text-red-500 font-medium" : ""}>
                      Due: {new Date(a.dueDate).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {isOverdue && " (Overdue)"}
                    </span>
                  )}
                </div>
              </div>

              {/* Status badge */}
              <div className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap ${
                isGraded
                  ? passed
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-600"
                  : isPending
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-gray-100 text-gray-500"
              }`}>
                {isGraded
                  ? `${passed ? "✓ Passed" : "✗ Needs Improvement"} · ${a.submission?.grade}/${a.maxPoints}`
                  : isPending
                  ? "⏳ Awaiting Grade"
                  : "Not Submitted"}
              </div>
            </div>

            {/* Instructions (collapsible) */}
            <div className="mt-3">
              <button
                onClick={() => setExpandedInstructions((prev) => ({ ...prev, [a.id]: !prev[a.id] }))}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                {expandedInstructions[a.id] ? "▲ Hide" : "▼ Show"} Instructions
              </button>
              {expandedInstructions[a.id] && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
                  {a.instructions}
                </div>
              )}
            </div>

            {/* Rubric preview */}
            {a.rubric && a.rubric.length > 0 && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-semibold text-gray-600 mb-2">Grading Rubric</p>
                <div className="space-y-1">
                  {a.rubric.map((r) => (
                    <div key={r.criterion} className="flex justify-between text-xs text-gray-500">
                      <span>{r.criterion}{r.description && ` — ${r.description}`}</span>
                      <span className="font-medium">{r.maxPoints} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Grade & Feedback */}
            {isGraded && (
              <div className={`mt-3 p-3 rounded-lg text-sm ${
                passed ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
              }`}>
                <p className={`font-semibold ${passed ? "text-green-700" : "text-red-700"}`}>
                  Score: {a.submission?.grade} / {a.maxPoints}
                </p>
                {a.submission?.feedback && (
                  <p className="mt-1 text-gray-600">{a.submission.feedback}</p>
                )}
              </div>
            )}

            {/* Submission Area */}
            {(!hasSubmission || (a.allowResubmission && isGraded)) && (
              <div className="mt-4">
                {error[a.id] && (
                  <p className="text-red-500 text-xs mb-2">{error[a.id]}</p>
                )}

                {/* FILE UPLOAD */}
                {a.submissionType === "FILE_UPLOAD" && (
                  <>
                    <input
                      type="file"
                      ref={(el) => { fileRefs.current[a.id] = el; }}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) submitFile(a.id, file);
                      }}
                    />
                    <button
                      onClick={() => fileRefs.current[a.id]?.click()}
                      disabled={submitting === a.id}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      <span>📎</span>
                      {submitting === a.id ? "Uploading..." : "Upload File"}
                    </button>
                  </>
                )}

                {/* TEXT RESPONSE */}
                {a.submissionType === "TEXT_RESPONSE" && (
                  <div className="space-y-2">
                    <textarea
                      rows={5}
                      value={textAnswers[a.id] ?? ""}
                      onChange={(e) => setTextAnswers((t) => ({ ...t, [a.id]: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder={typeConfig?.placeholder}
                    />
                    <button
                      onClick={() => submitJson(a.id, { textAnswer: textAnswers[a.id] })}
                      disabled={submitting === a.id || !(textAnswers[a.id] ?? "").trim()}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      <span>✏️</span>
                      {submitting === a.id ? "Submitting..." : "Submit Response"}
                    </button>
                  </div>
                )}

                {/* EXTERNAL LINK */}
                {a.submissionType === "EXTERNAL_LINK" && (
                  <div className="space-y-2">
                    <input
                      type="url"
                      value={linkUrls[a.id] ?? ""}
                      onChange={(e) => setLinkUrls((l) => ({ ...l, [a.id]: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder={typeConfig?.placeholder}
                    />
                    <button
                      onClick={() => submitJson(a.id, { linkUrl: linkUrls[a.id] })}
                      disabled={submitting === a.id || !(linkUrls[a.id] ?? "").startsWith("http")}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      <span>🔗</span>
                      {submitting === a.id ? "Submitting..." : "Submit Link"}
                    </button>
                  </div>
                )}

                {/* TASK COMPLETION */}
                {a.submissionType === "TASK_COMPLETION" && (
                  <button
                    onClick={() => submitJson(a.id, {})}
                    disabled={submitting === a.id}
                    className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    <span>✅</span>
                    {submitting === a.id ? "Marking..." : "Mark Task Complete"}
                  </button>
                )}
              </div>
            )}

            {/* Pending submission info */}
            {isPending && (
              <div className="mt-3 flex items-center gap-2 text-xs text-yellow-600">
                <span>⏳</span>
                <span>
                  Submitted {new Date(a.submission!.submittedAt).toLocaleDateString()} · Waiting for review
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
