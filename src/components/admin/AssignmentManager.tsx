"use client";

import { useState, useEffect } from "react";

interface Course {
  id: string;
  title: string;
  slug: string;
}

interface Lesson {
  id: string;
  title: string;
  order: number;
}

interface Module {
  id: string;
  title: string;
}

interface RubricCriterion {
  criterion: string;
  maxPoints: number;
  description?: string;
}

interface AssignmentFormData {
  courseId: string;
  lessonId: string;
  moduleId: string;
  title: string;
  description: string;
  instructions: string;
  submissionType: string;
  dueDate: string;
  startDate: string;
  maxPoints: number;
  passingScore: number;
  allowLateSubmission: boolean;
  allowResubmission: boolean;
  maxFileSizeMB: number;
  isPublished: boolean;
  isRequired: boolean;
  order: number;
  rubric: RubricCriterion[];
}

interface Assignment {
  id: string;
  title: string;
  submissionType: string;
  dueDate?: string | null;
  maxPoints: number;
  passingScore: number;
  isPublished: boolean;
  isRequired: boolean;
  _count: { submissions: number };
  lesson?: { id: string; title: string } | null;
  module?: { id: string; title: string } | null;
}

const SUBMISSION_TYPES = [
  { value: "FILE_UPLOAD", label: "File Upload", icon: "📎", desc: "Student uploads a file (PDF, DOCX, XLSX, image, ZIP)" },
  { value: "TEXT_RESPONSE", label: "Text Response", icon: "✏️", desc: "Student writes a text answer (essay, reflection)" },
  { value: "EXTERNAL_LINK", label: "External Link", icon: "🔗", desc: "Student submits a URL (Google Drive, portfolio, etc.)" },
  { value: "TASK_COMPLETION", label: "Task Completion", icon: "✅", desc: "Student marks a practical task as complete" },
];

const defaultForm: AssignmentFormData = {
  courseId: "",
  lessonId: "",
  moduleId: "",
  title: "",
  description: "",
  instructions: "",
  submissionType: "FILE_UPLOAD",
  dueDate: "",
  startDate: "",
  maxPoints: 100,
  passingScore: 70,
  allowLateSubmission: false,
  allowResubmission: false,
  maxFileSizeMB: 10,
  isPublished: false,
  isRequired: true,
  order: 0,
  rubric: [],
};

export default function AssignmentManager() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AssignmentFormData>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/courses")
      .then((r) => r.json())
      .then((d) => { if (d.success) setCourses(d.data); });
  }, []);

  useEffect(() => {
    if (!selectedCourse) return;
    Promise.all([
      fetch(`/api/admin/assignments?courseId=${selectedCourse}`).then((r) => r.json()),
      fetch(`/api/admin/lessons?courseId=${selectedCourse}`).then((r) => r.json()),
      fetch(`/api/admin/modules?courseId=${selectedCourse}`).then((r) => r.json()),
    ]).then(([aData, lData, mData]) => {
      if (aData.success) setAssignments(aData.data);
      if (lData.success) setLessons(lData.data);
      if (mData.success) setModules(mData.data);
    });
  }, [selectedCourse]);

  function openCreate() {
    setForm({ ...defaultForm, courseId: selectedCourse });
    setEditingId(null);
    setShowForm(true);
    setError("");
  }

  function openEdit(a: Assignment) {
    setForm({
      courseId: selectedCourse,
      lessonId: a.lesson?.id ?? "",
      moduleId: a.module?.id ?? "",
      title: a.title,
      description: "",
      instructions: "",
      submissionType: a.submissionType,
      dueDate: a.dueDate ? new Date(a.dueDate).toISOString().slice(0, 16) : "",
      startDate: "",
      maxPoints: a.maxPoints,
      passingScore: a.passingScore,
      allowLateSubmission: false,
      allowResubmission: false,
      maxFileSizeMB: 10,
      isPublished: a.isPublished,
      isRequired: a.isRequired,
      order: 0,
      rubric: [],
    });
    setEditingId(a.id);
    setShowForm(true);
    setError("");
  }

  function addRubricRow() {
    setForm((f) => ({
      ...f,
      rubric: [...f.rubric, { criterion: "", maxPoints: 10, description: "" }],
    }));
  }

  function updateRubricRow(idx: number, field: keyof RubricCriterion, value: string | number) {
    setForm((f) => {
      const rubric = f.rubric.map((r, i) =>
        i === idx ? { ...r, [field]: value } : r
      );
      return { ...f, rubric };
    });
  }

  function removeRubricRow(idx: number) {
    setForm((f) => ({ ...f, rubric: f.rubric.filter((_, i) => i !== idx) }));
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        lessonId: form.lessonId || null,
        moduleId: form.moduleId || null,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
        rubric: form.rubric.length > 0 ? form.rubric : null,
      };
      const url = editingId
        ? `/api/admin/assignments/${editingId}`
        : "/api/admin/assignments";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setShowForm(false);
        // Reload
        const refreshed = await fetch(`/api/admin/assignments?courseId=${selectedCourse}`).then((r) => r.json());
        if (refreshed.success) setAssignments(refreshed.data);
      } else {
        setError(data.error ?? "Failed to save");
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this assignment? All submissions will also be deleted.")) return;
    const res = await fetch(`/api/admin/assignments/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      setAssignments((prev) => prev.filter((a) => a.id !== id));
    }
  }

  async function togglePublish(a: Assignment) {
    const res = await fetch(`/api/admin/assignments/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !a.isPublished }),
    });
    const data = await res.json();
    if (data.success) {
      setAssignments((prev) => prev.map((x) => x.id === a.id ? { ...x, isPublished: !x.isPublished } : x));
    }
  }

  const typeIcon: Record<string, string> = {
    FILE_UPLOAD: "📎",
    TEXT_RESPONSE: "✏️",
    EXTERNAL_LINK: "🔗",
    TASK_COMPLETION: "✅",
  };

  return (
    <div className="space-y-5">
      {/* Course selector */}
      <div className="flex items-center gap-4 flex-wrap">
        <div>
          <label className="text-sm font-medium text-gray-700 mr-2">Course:</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select course...</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
        {selectedCourse && (
          <button
            onClick={openCreate}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + New Assignment
          </button>
        )}
      </div>

      {/* Assignment list */}
      {selectedCourse && assignments.length === 0 && !showForm && (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-400">
          <p className="text-xl mb-2">📋</p>
          <p className="font-medium">No assignments yet</p>
          <p className="text-sm mt-1">Click &quot;New Assignment&quot; to create the first one</p>
        </div>
      )}

      {assignments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Assignment</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Linked To</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Due Date</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Points</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Submissions</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {assignments.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{a.title}</p>
                    {a.isRequired && (
                      <span className="text-xs text-red-500">Required</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                      {typeIcon[a.submissionType]} {a.submissionType.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {a.lesson?.title ?? a.module?.title ?? "Course-level"}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    {a.maxPoints}
                    <span className="text-xs text-gray-400"> (pass: {a.passingScore})</span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    {a._count.submissions}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => togglePublish(a)} className={`text-xs px-2 py-1 rounded-full font-medium transition-colors ${
                      a.isPublished
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}>
                      {a.isPublished ? "Published" : "Draft"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(a)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? "Edit Assignment" : "New Assignment"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>

            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}

              {/* Basic Info */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Basic Info</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Title *</label>
                    <input
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Excel Bookkeeping Task"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Description</label>
                    <input
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-blue-500"
                      placeholder="Brief description shown to students"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Instructions *</label>
                    <textarea
                      rows={4}
                      value={form.instructions}
                      onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-blue-500"
                      placeholder="Detailed step-by-step instructions for the student..."
                    />
                  </div>
                </div>
              </section>

              {/* Submission Type */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Submission Type</h3>
                <div className="grid grid-cols-2 gap-2">
                  {SUBMISSION_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, submissionType: t.value }))}
                      className={`flex items-start gap-2 p-3 rounded-lg border text-left transition-colors ${
                        form.submissionType === t.value
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-xl mt-0.5">{t.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{t.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              {/* Link To Lesson/Module */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Link To (Optional)</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600">Lesson</label>
                    <select
                      value={form.lessonId}
                      onChange={(e) => setForm((f) => ({ ...f, lessonId: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">None (course-level)</option>
                      {lessons.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.order}. {l.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Module</label>
                    <select
                      value={form.moduleId}
                      onChange={(e) => setForm((f) => ({ ...f, moduleId: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">None</option>
                      {modules.map((m) => (
                        <option key={m.id} value={m.id}>{m.title}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              {/* Timing */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Timing</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600">Start Date</label>
                    <input
                      type="datetime-local"
                      value={form.startDate}
                      onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Due Date</label>
                    <input
                      type="datetime-local"
                      value={form.dueDate}
                      onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.allowLateSubmission}
                      onChange={(e) => setForm((f) => ({ ...f, allowLateSubmission: e.target.checked }))}
                      className="rounded"
                    />
                    Allow late submission
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.allowResubmission}
                      onChange={(e) => setForm((f) => ({ ...f, allowResubmission: e.target.checked }))}
                      className="rounded"
                    />
                    Allow resubmission
                  </label>
                </div>
              </section>

              {/* Grading */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Grading</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600">Total Points</label>
                    <input
                      type="number"
                      min={1}
                      value={form.maxPoints}
                      onChange={(e) => setForm((f) => ({ ...f, maxPoints: Number(e.target.value) }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Passing Score</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={form.passingScore}
                      onChange={(e) => setForm((f) => ({ ...f, passingScore: Number(e.target.value) }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {form.submissionType === "FILE_UPLOAD" && (
                    <div>
                      <label className="text-xs font-medium text-gray-600">Max File Size (MB)</label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={form.maxFileSizeMB}
                        onChange={(e) => setForm((f) => ({ ...f, maxFileSizeMB: Number(e.target.value) }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>

                {/* Rubric */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-gray-600">Grading Rubric (optional)</label>
                    <button
                      type="button"
                      onClick={addRubricRow}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      + Add Criterion
                    </button>
                  </div>
                  {form.rubric.length > 0 && (
                    <div className="space-y-2">
                      {form.rubric.map((r, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            value={r.criterion}
                            onChange={(e) => updateRubricRow(idx, "criterion", e.target.value)}
                            className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-blue-500"
                            placeholder="Criterion (e.g., Accuracy)"
                          />
                          <input
                            type="number"
                            min={1}
                            value={r.maxPoints}
                            onChange={(e) => updateRubricRow(idx, "maxPoints", Number(e.target.value))}
                            className="w-20 border border-gray-300 rounded px-2 py-1.5 text-sm text-center focus:ring-1 focus:ring-blue-500"
                            placeholder="Pts"
                          />
                          <button
                            type="button"
                            onClick={() => removeRubricRow(idx)}
                            className="text-red-400 hover:text-red-600 text-lg leading-none"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                      <p className="text-xs text-gray-400 mt-1">
                        Rubric total: {form.rubric.reduce((s, r) => s + r.maxPoints, 0)} pts
                        {form.rubric.reduce((s, r) => s + r.maxPoints, 0) !== form.maxPoints && (
                          <span className="text-yellow-600 ml-2">
                            ⚠ Doesn't match total points ({form.maxPoints})
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* Settings */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Settings</h3>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isRequired}
                      onChange={(e) => setForm((f) => ({ ...f, isRequired: e.target.checked }))}
                      className="rounded"
                    />
                    Required to pass lesson
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isPublished}
                      onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
                      className="rounded"
                    />
                    Publish immediately
                  </label>
                </div>
              </section>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.title || !form.instructions || !form.courseId}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving..." : editingId ? "Update Assignment" : "Create Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
