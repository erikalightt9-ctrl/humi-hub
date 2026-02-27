"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Lesson {
  id: string;
  title: string;
  content: string;
  durationMin: number;
  completed: boolean;
}

export default function LessonViewerPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const router = useRouter();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [courseId, setCourseId] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [certificate, setCertificate] = useState<{ certNumber: string } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    params.then(({ courseId: cId, lessonId: lId }) => {
      setCourseId(cId);
      setLessonId(lId);
      fetch(`/api/student/courses/${cId}/lessons`)
        .then((r) => r.json())
        .then((data) => {
          const found = data.data?.find((l: Lesson) => l.id === lId);
          if (found) {
            setLesson(found);
            setCompleted(found.completed);
          }
        });
    });
  }, [params]);

  async function markComplete() {
    setCompleting(true);
    try {
      const res = await fetch(`/api/student/lessons/${lessonId}/complete`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setCompleted(true);
        if (data.data?.certificate) {
          setCertificate(data.data.certificate);
        }
      }
    } catch {
      setError("Failed to mark lesson complete");
    } finally {
      setCompleting(false);
    }
  }

  if (!lesson) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-700 text-white px-6 py-4">
        <Link href={`/student/courses/${courseId}`} className="text-blue-200 hover:text-white text-sm">← Course Overview</Link>
        <h1 className="text-xl font-bold mt-1">{lesson.title}</h1>
        {lesson.durationMin > 0 && <p className="text-blue-200 text-sm">{lesson.durationMin} min read</p>}
      </div>
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow p-8">
          <div className="prose max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
            {lesson.content}
          </div>
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
          {certificate && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl text-center">
              <div className="text-2xl mb-2">🎓</div>
              <p className="font-semibold text-green-700">Congratulations! You've earned a certificate!</p>
              <a href={`/api/student/certificates/${certificate.certNumber}/download`}
                className="mt-3 inline-block bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">
                Download Certificate
              </a>
            </div>
          )}
          <div className="mt-8 flex justify-end">
            {completed ? (
              <div className="flex items-center gap-2 text-green-600 font-medium">
                <span className="text-xl">✓</span> Lesson Completed
              </div>
            ) : (
              <button onClick={markComplete} disabled={completing}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                {completing ? "Marking Complete..." : "Mark as Complete"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
