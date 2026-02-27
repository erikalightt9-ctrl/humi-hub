"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface Submission {
  id: string;
  status: string;
  grade?: number;
  feedback?: string;
  fileName: string;
}

interface Assignment {
  id: string;
  title: string;
  instructions: string;
  dueDate?: string;
  maxPoints: number;
  submission: Submission | null;
}

export default function AssignmentsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const [courseId, setCourseId] = useState("");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  async function loadAssignments(cId: string) {
    const res = await fetch(`/api/student/courses/${cId}/assignments`);
    const data = await res.json();
    if (data.success) setAssignments(data.data);
  }

  useEffect(() => {
    params.then(({ courseId: cId }) => {
      setCourseId(cId);
      loadAssignments(cId);
    });
  }, [params]);

  async function handleSubmit(assignmentId: string, file: File) {
    setUploading(assignmentId);
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`/api/student/assignments/${assignmentId}/submit`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        await loadAssignments(courseId);
      } else {
        setError(data.error ?? "Failed to upload");
      }
    } catch {
      setError("Network error");
    } finally {
      setUploading(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-700 text-white px-6 py-4">
        <Link href={`/student/courses/${courseId}`} className="text-blue-200 hover:text-white text-sm">← Course</Link>
        <h1 className="text-xl font-bold mt-1">Assignments</h1>
      </div>
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {assignments.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-400">No assignments posted yet.</div>
        ) : assignments.map((a) => (
          <div key={a.id} className="bg-white rounded-xl shadow p-6">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-gray-800">{a.title}</h3>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${a.submission ? a.submission.status === "GRADED" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"}`}>
                {a.submission ? a.submission.status : "Not Submitted"}
              </span>
            </div>
            <p className="text-gray-600 text-sm mt-2 whitespace-pre-wrap">{a.instructions}</p>
            {a.dueDate && <p className="text-xs text-gray-400 mt-2">Due: {new Date(a.dueDate).toLocaleDateString()}</p>}
            {a.submission?.status === "GRADED" && (
              <div className="mt-3 p-3 bg-green-50 rounded-lg text-sm">
                <p className="font-medium text-green-700">Grade: {a.submission.grade}/{a.maxPoints}</p>
                {a.submission.feedback && <p className="text-gray-600 mt-1">{a.submission.feedback}</p>}
              </div>
            )}
            {!a.submission && (
              <div className="mt-4">
                <input type="file" ref={(el) => { fileRefs.current[a.id] = el; }}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif" className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleSubmit(a.id, file);
                  }} />
                <button onClick={() => fileRefs.current[a.id]?.click()}
                  disabled={uploading === a.id}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                  {uploading === a.id ? "Uploading..." : "Upload Submission"}
                </button>
              </div>
            )}
            {a.submission && a.submission.status !== "GRADED" && (
              <p className="text-sm text-gray-500 mt-3">Submitted: {a.submission.fileName} • Awaiting grade</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
