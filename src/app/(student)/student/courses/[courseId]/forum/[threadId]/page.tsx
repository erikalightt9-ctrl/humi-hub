"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Post {
  id: string;
  content: string;
  createdAt: string;
  parentId: string | null;
  student: { id: string; name: string };
  replies: Post[];
}

interface Thread {
  id: string;
  title: string;
  courseId: string;
  student: { id: string; name: string };
  posts: Post[];
}

export default function ThreadViewPage({
  params,
}: {
  params: Promise<{ courseId: string; threadId: string }>;
}) {
  const [thread, setThread] = useState<Thread | null>(null);
  const [courseId, setCourseId] = useState("");
  const [threadId, setThreadId] = useState("");
  const [reply, setReply] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  async function loadThread(cId: string, tId: string) {
    const res = await fetch(`/api/student/forum/${tId}`);
    const data = await res.json();
    if (data.success) setThread(data.data);
  }

  useEffect(() => {
    params.then(({ courseId: cId, threadId: tId }) => {
      setCourseId(cId);
      setThreadId(tId);
      loadThread(cId, tId);
    });
  }, [params]);

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    setPosting(true);
    setError("");
    try {
      const res = await fetch(`/api/student/forum/${threadId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: reply }),
      });
      const data = await res.json();
      if (data.success) {
        setReply("");
        await loadThread(courseId, threadId);
      } else {
        setError(data.error ?? "Failed to post reply");
      }
    } catch {
      setError("Network error");
    } finally {
      setPosting(false);
    }
  }

  if (!thread) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-700 text-white px-6 py-4">
        <Link href={`/student/courses/${courseId}/forum`} className="text-blue-200 hover:text-white text-sm">← Forum</Link>
        <h1 className="text-xl font-bold mt-1">{thread.title}</h1>
      </div>
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        {thread.posts.map((post) => (
          <div key={post.id} className="bg-white rounded-xl shadow p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                {post.student.name[0]}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-800">{post.student.name}</div>
                <div className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleString()}</div>
              </div>
            </div>
            <p className="text-gray-700 text-sm whitespace-pre-wrap">{post.content}</p>
            {post.replies.length > 0 && (
              <div className="mt-4 pl-4 border-l-2 border-gray-100 space-y-3">
                {post.replies.map((r) => (
                  <div key={r.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs font-medium text-gray-600 mb-1">{r.student.name}</div>
                    <p className="text-sm text-gray-700">{r.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold text-gray-700 mb-3">Add a Reply</h3>
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <form onSubmit={handleReply} className="space-y-3">
            <textarea value={reply} onChange={(e) => setReply(e.target.value)}
              placeholder="Write your reply..." required rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div className="flex justify-end">
              <button type="submit" disabled={posting}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                {posting ? "Posting..." : "Post Reply"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
