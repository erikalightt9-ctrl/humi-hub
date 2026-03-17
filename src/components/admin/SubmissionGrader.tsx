"use client";

import { useState, useEffect } from "react";

interface Submission {
  id: string;
  fileName?: string | null;
  fileSize?: number | null;
  textAnswer?: string | null;
  linkUrl?: string | null;
  taskCompleted?: boolean | null;
  submittedAt: string;
  status: string;
  student: { name: string; email: string };
  assignment: {
    title: string;
    courseId: string;
    maxPoints: number;
    passingScore: number;
    submissionType: string;
    rubric?: Array<{ criterion: string; maxPoints: number; description?: string }> | null;
    lesson?: { title: string } | null;
    course?: { title: string } | null;
  };
}

interface RubricScore {
  [criterion: string]: number;
}

export default function SubmissionGrader({ role }: { role: "admin" | "trainer" }) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState<string | null>(null);
  const [grade, setGrade] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [rubricScores, setRubricScores] = useState<Record<string, RubricScore>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");

  const apiBase = role === "admin" ? "/api/admin" : "/api/trainer";

  async function loadSubmissions() {
    setLoading(true);
    const res = await fetch(`${apiBase}/submissions`);
    const data = await res.json();
    if (data.success) setSubmissions(data.data);
    setLoading(false);
  }

  useEffect(() => { loadSubmissions(); }, []);

  function calcRubricTotal(submissionId: string, rubric: Submission["assignment"]["rubric"]): number {
    if (!rubric) return grade[submissionId] ?? 0;
    const scores = rubricScores[submissionId] ?? {};
    return rubric.reduce((sum, r) => sum + (scores[r.criterion] ?? 0), 0);
  }

  function setRubricScore(submissionId: string, criterion: string, value: number) {
    setRubricScores((prev) => ({
      ...prev,
      [submissionId]: { ...(prev[submissionId] ?? {}), [criterion]: value },
    }));
  }

  async function handleGrade(s: Submission) {
    setSaving(s.id);
    setError("");
    const rubric = s.assignment.rubric;
    const computedGrade = rubric
      ? calcRubricTotal(s.id, rubric)
      : (grade[s.id] ?? 0);

    try {
      const res = await fetch(`${apiBase}/submissions/${s.id}/grade`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grade: computedGrade,
          feedback: feedback[s.id] ?? "",
          rubricScores: rubricScores[s.id],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGrading(null);
        loadSubmissions();
      } else {
        setError(data.error ?? "Failed to grade");
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(null);
    }
  }

  const typeLabel: Record<string, string> = {
    FILE_UPLOAD: "File Upload",
    TEXT_RESPONSE: "Text Response",
    EXTERNAL_LINK: "External Link",
    TASK_COMPLETION: "Task Completion",
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading submissions...</div>;
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}

      {submissions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
          <p className="text-xl mb-2">🎉</p>
          <p className="font-medium">No pending submissions</p>
          <p className="text-sm mt-1">All caught up!</p>
        </div>
      ) : (
        submissions.map((s) => (
          <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900">{s.assignment.title}</h3>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {typeLabel[s.assignment.submissionType] ?? s.assignment.submissionType}
                  </span>
                  {s.assignment.lesson && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {s.assignment.lesson.title}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  {s.student.name} &bull; {s.student.email}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Submitted {new Date(s.submittedAt).toLocaleString()}
                </p>
              </div>
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">
                {s.status}
              </span>
            </div>

            {/* Submission Content */}
            <div className="bg-gray-50 rounded-lg p-4 text-sm">
              {s.assignment.submissionType === "FILE_UPLOAD" && s.fileName && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">📎</span>
                  <a
                    href={`/uploads/submissions/${s.fileName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {s.fileName}
                  </a>
                  {s.fileSize && (
                    <span className="text-gray-400 text-xs">
                      ({Math.round(s.fileSize / 1024)}KB)
                    </span>
                  )}
                </div>
              )}
              {s.assignment.submissionType === "TEXT_RESPONSE" && s.textAnswer && (
                <div>
                  <p className="text-xs text-gray-500 mb-1 font-medium">Student Response:</p>
                  <p className="text-gray-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {s.textAnswer}
                  </p>
                </div>
              )}
              {s.assignment.submissionType === "EXTERNAL_LINK" && s.linkUrl && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">🔗</span>
                  <a
                    href={s.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    {s.linkUrl}
                  </a>
                </div>
              )}
              {s.assignment.submissionType === "TASK_COMPLETION" && (
                <p className="text-green-700 font-medium">✓ Student marked task as completed</p>
              )}
            </div>

            {/* Grading Panel */}
            {grading === s.id ? (
              <div className="space-y-4 border-t border-gray-100 pt-4">
                {s.assignment.rubric && s.assignment.rubric.length > 0 ? (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-3">Rubric Scoring</p>
                    <div className="space-y-3">
                      {s.assignment.rubric.map((r) => (
                        <div key={r.criterion} className="flex items-center gap-4">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700">{r.criterion}</p>
                            {r.description && (
                              <p className="text-xs text-gray-400">{r.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              max={r.maxPoints}
                              value={rubricScores[s.id]?.[r.criterion] ?? ""}
                              onChange={(e) => setRubricScore(s.id, r.criterion, Number(e.target.value))}
                              className="w-20 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-center focus:ring-2 focus:ring-blue-500"
                              placeholder="0"
                            />
                            <span className="text-xs text-gray-500">/ {r.maxPoints}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 text-right text-sm font-semibold text-gray-700">
                      Total: {calcRubricTotal(s.id, s.assignment.rubric)} / {s.assignment.maxPoints}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Grade (0–{s.assignment.maxPoints}) &nbsp;
                      <span className="text-gray-400 font-normal">Passing: {s.assignment.passingScore}</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={s.assignment.maxPoints}
                      value={grade[s.id] ?? ""}
                      onChange={(e) => setGrade((prev) => ({ ...prev, [s.id]: Number(e.target.value) }))}
                      className="w-32 border border-gray-300 rounded-lg px-3 py-1.5 text-sm mt-1 block focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-700">Feedback</label>
                  <textarea
                    rows={3}
                    value={feedback[s.id] ?? ""}
                    onChange={(e) => setFeedback((prev) => ({ ...prev, [s.id]: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-blue-500"
                    placeholder="Write constructive feedback for the student..."
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleGrade(s)}
                    disabled={saving === s.id || !feedback[s.id]}
                    className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {saving === s.id ? "Saving..." : "Submit Grade"}
                  </button>
                  <button
                    onClick={() => setGrading(null)}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setGrading(s.id)}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Grade Submission
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}
