"use client";

import { useState, useEffect, useRef } from "react";
import {
  BookOpen,
  FileText,
  FileImage,
  Sheet,
  Presentation,
  Upload,
  Download,
  Search,
  X,
  Plus,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Course {
  id: string;
  title: string;
}

interface Resource {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  type: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  createdAt: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ResourceIcon({ type }: { type: string }) {
  if (type === "pdf") return <FileText className="h-5 w-5 text-red-500" />;
  if (type === "image") return <FileImage className="h-5 w-5 text-green-500" />;
  if (type === "xls") return <Sheet className="h-5 w-5 text-emerald-600" />;
  if (type === "ppt") return <Presentation className="h-5 w-5 text-orange-500" />;
  if (type === "doc") return <FileText className="h-5 w-5 text-blue-500" />;
  return <FileText className="h-5 w-5 text-gray-400" />;
}

function TypeBadge({ type }: { type: string }) {
  const labels: Record<string, string> = {
    pdf: "PDF",
    doc: "DOC",
    xls: "XLS",
    ppt: "PPT",
    image: "Image",
    other: "File",
  };
  const colors: Record<string, string> = {
    pdf: "bg-red-100 text-red-700",
    doc: "bg-blue-100 text-blue-700",
    xls: "bg-emerald-100 text-emerald-700",
    ppt: "bg-orange-100 text-orange-700",
    image: "bg-green-100 text-green-700",
    other: "bg-gray-100 text-gray-700",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[type] ?? colors.other}`}>
      {labels[type] ?? "File"}
    </span>
  );
}

export function TrainerMaterials() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeCourseId, setActiveCourseId] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload state
  const [showUpload, setShowUpload] = useState(false);
  const [uploadCourseId, setUploadCourseId] = useState("");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/trainer/resources");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setResources(json.data.resources);
      setCourses(json.data.courses);
      if (json.data.courses.length > 0 && uploadCourseId === "") {
        setUploadCourseId(json.data.courses[0].id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load materials");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = resources.filter((r) => {
    const matchesCourse = activeCourseId === "all" || r.courseId === activeCourseId;
    const matchesSearch = search === "" || r.title.toLowerCase().includes(search.toLowerCase()) || r.fileName.toLowerCase().includes(search.toLowerCase());
    return matchesCourse && matchesSearch;
  });

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadFile || !uploadTitle || !uploadCourseId) return;
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("courseId", uploadCourseId);
      fd.append("title", uploadTitle);
      fd.append("file", uploadFile);
      const res = await fetch("/api/trainer/resources", { method: "POST", body: fd });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setShowUpload(false);
      setUploadTitle("");
      setUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await load();
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Training Materials</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage and share materials with your students.
          </p>
        </div>
        {courses.length > 0 && (
          <Button onClick={() => setShowUpload((v) => !v)} size="sm" className="gap-1.5">
            {showUpload ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showUpload ? "Cancel" : "Upload Material"}
          </Button>
        )}
      </div>

      {/* Upload form */}
      {showUpload && (
        <form onSubmit={handleUpload} className="bg-white border border-blue-200 rounded-xl p-5 mb-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Upload className="h-4 w-4 text-blue-600" />
            Upload New Material
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Course</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={uploadCourseId}
                onChange={(e) => setUploadCourseId(e.target.value)}
                required
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Title</label>
              <Input
                placeholder="e.g. Week 1 Slides"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="text-xs font-medium text-gray-600 mb-1 block">File</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp"
              className="block w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:text-sm file:font-medium hover:file:bg-blue-100 cursor-pointer"
              onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
              required
            />
            <p className="text-xs text-gray-400 mt-1">PDF, DOC, XLS, PPT, or image — max 10 MB</p>
          </div>
          {uploadError && <p className="text-red-600 text-sm mb-3">{uploadError}</p>}
          <Button type="submit" disabled={uploading} size="sm">
            {uploading ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" />Uploading…</> : "Upload"}
          </Button>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-600 text-sm">
          {error}
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No Courses Assigned</h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            You are not assigned to any training schedules yet. Once an admin assigns you to a
            schedule, you can manage course materials here.
          </p>
        </div>
      ) : (
        <>
          {/* Course tabs */}
          <div className="flex gap-2 flex-wrap mb-5">
            <button
              onClick={() => setActiveCourseId("all")}
              className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${activeCourseId === "all" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}
            >
              All Courses
            </button>
            {courses.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCourseId(c.id)}
                className={`text-sm px-3 py-1.5 rounded-lg border transition-colors truncate max-w-[200px] ${activeCourseId === c.id ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}
              >
                {c.title}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search materials…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Resource list */}
          {filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
              <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No materials found.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
              {filtered.map((r) => (
                <div key={r.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="shrink-0">
                    <ResourceIcon type={r.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{r.title}</p>
                    <p className="text-xs text-gray-400 truncate">{r.fileName} · {formatBytes(r.fileSize)}</p>
                  </div>
                  <div className="shrink-0 hidden sm:flex items-center gap-2">
                    {activeCourseId === "all" && (
                      <span className="text-xs text-gray-500 truncate max-w-[150px]">{r.courseTitle}</span>
                    )}
                    <TypeBadge type={r.type} />
                  </div>
                  <a
                    href={r.filePath}
                    download={r.fileName}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-gray-400 mt-3 text-right">
            {filtered.length} material{filtered.length !== 1 ? "s" : ""}
          </p>
        </>
      )}
    </div>
  );
}
