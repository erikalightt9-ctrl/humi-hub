"use client";

import { useState, useEffect } from "react";

interface Submission {
  id: string;
  fileName: string;
  fileSize: number;
  submittedAt: string;
  status: string;
  student: { name: string; email: string };
  assignment: { title: string };
}

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [grading, setGrading] = useState<string | null>(null);
  const [grade, setGrade] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function loadSubmissions() {
    const res = await fetch("/api/admin/submissions");
    const data = await res.json();
    if (data.success) setSubmissions(data.data);
  }

  useEffect(() => { loadSubmissions(); }, []);

  async function handleGrade(submissionId: string) {
    setSaving(submissionId);
    setError("");
    try {
      const res = await fetch(`/api/admin/submissions/${submissionId}/grade`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grade: grade[submissionId] ?? 0,
          feedback: feedback[submissionId] ?? "",
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Assignment Submissions</h1>
        <p className="text-gray-500 text-sm mt-1">Review and grade student submissions</p>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
        {submissions.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-10 text-center text-gray-400">
            No pending submissions.
          </div>
        ) : submissions.map((s) => (
          <div key={s.id} className="bg-white rounded-xl shadow p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-800">{s.assignment.title}</h3>
                <p className="text-sm text-gray-500">{s.student.name} ({s.student.email})</p>
                <p className="text-xs text-gray-400 mt-1">
                  {s.fileName} • {Math.round(s.fileSize / 1024)}KB • Submitted {new Date(s.submittedAt).toLocaleString()}
                </p>
              </div>
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">
                {s.status}
              </span>
            </div>
            {grading === s.id ? (
              <div className="mt-4 space-y-3">
                <div className="flex gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-600">Grade (0-100)</label>
                    <input type="number" min={0} max={100}
                      value={grade[s.id] ?? ""}
                      onChange={(e) => setGrade((prev) => ({ ...prev, [s.id]: Number(e.target.value) }))}
                      className="w-24 border rounded-lg px-3 py-1.5 text-sm mt-1 block focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Feedback</label>
                  <textarea rows={3}
                    value={feedback[s.id] ?? ""}
                    onChange={(e) => setFeedback((prev) => ({ ...prev, [s.id]: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleGrade(s.id)} disabled={saving === s.id}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
                    {saving === s.id ? "Saving..." : "Submit Grade"}
                  </button>
                  <button onClick={() => setGrading(null)}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setGrading(s.id)}
                className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
                Grade
              </button>
            )}
          </div>
        ))}
    </div>
  );
}
