"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Thread {
  id: string;
  title: string;
  createdAt: string;
  student: { name: string };
  _count: { posts: number };
}

export default function ForumPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const [courseId, setCourseId] = useState("");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    params.then(({ courseId: cId }) => {
      setCourseId(cId);
      fetch(`/api/student/courses/${cId}/forum`)
        .then((r) => r.json())
        .then((data) => { if (data.success) setThreads(data.data); });
    });
  }, [params]);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    setPosting(true);
    setError("");
    try {
      const res = await fetch(`/api/student/courses/${courseId}/forum`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      const data = await res.json();
      if (data.success) {
        setTitle("");
        setContent("");
        setShowForm(false);
        // Reload threads
        const r2 = await fetch(`/api/student/courses/${courseId}/forum`);
        const d2 = await r2.json();
        if (d2.success) setThreads(d2.data);
      } else {
        setError(data.error ?? "Failed to post");
      }
    } catch {
      setError("Network error");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-700 text-white px-6 py-4">
        <Link href={`/student/courses/${courseId}`} className="text-blue-200 hover:text-white text-sm">← Course</Link>
        <h1 className="text-xl font-bold mt-1">Discussion Forum</h1>
      </div>
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <div className="flex justify-end">
          <button onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
            + New Thread
          </button>
        </div>
        {showForm && (
          <form onSubmit={handlePost} className="bg-white rounded-xl shadow p-6 space-y-4">
            <h3 className="font-semibold text-gray-700">Start a New Thread</h3>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <input type="text" placeholder="Thread title" value={title}
              onChange={(e) => setTitle(e.target.value)} required
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <textarea placeholder="Content..." value={content}
              onChange={(e) => setContent(e.target.value)} required rows={4}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
              <button type="submit" disabled={posting}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                {posting ? "Posting..." : "Post"}
              </button>
            </div>
          </form>
        )}
        {threads.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-400">
            No threads yet. Be the first to start a discussion!
          </div>
        ) : threads.map((t) => (
          <Link key={t.id} href={`/student/courses/${courseId}/forum/${t.id}`}
            className="block bg-white rounded-xl shadow p-5 hover:shadow-md transition">
            <h3 className="font-medium text-gray-800">{t.title}</h3>
            <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
              <span>{t.student.name}</span>
              <span>•</span>
              <span>{new Date(t.createdAt).toLocaleDateString()}</span>
              <span>•</span>
              <span>{t._count.posts} {t._count.posts === 1 ? "reply" : "replies"}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
