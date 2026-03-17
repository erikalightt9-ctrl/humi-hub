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
  lesson?: { id: string; title: string } | null;
  submission: Submission | null;
}

const TYPE_ICON: Record<string, string> = {
  FILE_UPLOAD: "📎",
  TEXT_RESPONSE: "✏️",
  EXTERNAL_LINK: "🔗",
  TASK_COMPLETION: "✅",
};

export default function StudentAssignmentsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const [courseId, setCourseId] = useState("");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [linkUrls, setLinkUrls] = useState<Record<string, string>>({});
  const [error, setError] = useState<Record<string, string>>({});
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  async function load(cId: string) {
    const res = await fetch(`/api/student/courses/${cId}/assignments`);
    const data = await res.json();
    if (data.success) setAssignments(data.data);
    setLoading(false);
  }

  useEffect(() => {
    params.then(({ courseId: cId }) => {
      setCourseId(cId);
      load(cId);
    });
  }, [params]);

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
      if (!data.success) {
        setError((e) => ({ ...e, [assignmentId]: data.error ?? "Upload failed" }));
      } else {
        load(courseId);
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
      if (!data.success) {
        setError((e) => ({ ...e, [assignmentId]: data.error ?? "Submission failed" }));
      } else {
        load(courseId);
      }
    } catch {
      setError((e) => ({ ...e, [assignmentId]: "Network error" }));
    } finally {
      setSubmitting(null);
    }
  }

  const pending = assignments.filter((a) => !a.submission);
  const submitted = assignments.filter((a) => a.submission?.status === "PENDING");
  const graded = assignments.filter((a) => a.submission?.status === "GRADED");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
        <p className="text-gray-500 text-sm mt-1">Submit your work and view your grades</p>
      </div>

      {/* Summary pills */}
      {assignments.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full font-medium">
            {pending.length} to submit
          </span>
          {submitted.length > 0 && (
            <span className="text-sm bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-full font-medium">
              {submitted.length} awaiting grade
            </span>
          )}
          {graded.length > 0 && (
            <span className="text-sm bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-medium">
              {graded.length} graded
            </span>
          )}
        </div>
      )}

      {assignments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
          <p className="text-xl mb-2">📋</p>
          <p className="font-medium">No assignments posted yet</p>
          <p className="text-sm mt-1">Check back later or look inside individual lessons</p>
        </div>
      ) : (
        assignments.map((a) => {
          const isGraded = a.submission?.status === "GRADED";
          const isPending = a.submission?.status === "PENDING";
          const passed =
            isGraded &&
            a.submission?.grade != null &&
            a.submission.grade >= a.passingScore;

          return (
            <div
              key={a.id}
              className={`bg-white rounded-xl border-2 p-6 transition-all ${
                isGraded
                  ? passed
                    ? "border-green-200"
                    : "border-red-200"
                  : isPending
                  ? "border-yellow-200"
                  : "border-gray-200"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg">{TYPE_ICON[a.submissionType] ?? "📋"}</span>
                    <h3 className="font-semibold text-gray-900">{a.title}</h3>
                    {a.isRequired && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                        Required
                      </span>
                    )}
                  </div>
                  {a.lesson && (
                    <p className="text-xs text-gray-400 mt-0.5">In: {a.lesson.title}</p>
                  )}
                  {a.dueDate && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Due: {new Date(a.dueDate).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>
                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap ${
                  isGraded
                    ? passed
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-600"
                    : isPending
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-600"
                }`}>
                  {isGraded
                    ? `${a.submission?.grade}/${a.maxPoints}`
                    : isPending
                    ? "Awaiting Grade"
                    : "Not Submitted"}
                </span>
              </div>

              <p className="text-gray-600 text-sm mt-3 whitespace-pre-wrap">{a.instructions}</p>

              {/* Grade feedback */}
              {isGraded && a.submission?.feedback && (
                <div className={`mt-3 p-3 rounded-lg text-sm border ${
                  passed ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                }`}>
                  <p className={`font-semibold ${passed ? "text-green-700" : "text-red-700"}`}>
                    Grade: {a.submission.grade}/{a.maxPoints}{passed ? " ✓ Passed" : " — Needs Improvement"}
                  </p>
                  <p className="text-gray-600 mt-1">{a.submission.feedback}</p>
                </div>
              )}

              {/* Submission form */}
              {!a.submission && (
                <div className="mt-4">
                  {error[a.id] && (
                    <p className="text-red-500 text-xs mb-2">{error[a.id]}</p>
                  )}

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

                  {a.submissionType === "TEXT_RESPONSE" && (
                    <div className="space-y-2">
                      <textarea
                        rows={4}
                        value={textAnswers[a.id] ?? ""}
                        onChange={(e) => setTextAnswers((t) => ({ ...t, [a.id]: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="Write your response here..."
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

                  {a.submissionType === "EXTERNAL_LINK" && (
                    <div className="space-y-2">
                      <input
                        type="url"
                        value={linkUrls[a.id] ?? ""}
                        onChange={(e) => setLinkUrls((l) => ({ ...l, [a.id]: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="https://docs.google.com/..."
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

              {isPending && (
                <p className="text-sm text-yellow-600 mt-3 flex items-center gap-1">
                  <span>⏳</span> Submitted — waiting for review
                </p>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
