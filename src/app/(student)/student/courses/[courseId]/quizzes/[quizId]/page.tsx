"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Question {
  id: string;
  type: string;
  question: string;
  options: string[];
  points: number;
  order: number;
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  passingScore: number;
  questions: Question[];
}

export default function TakeQuizPage({
  params,
}: {
  params: Promise<{ courseId: string; quizId: string }>;
}) {
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [courseId, setCourseId] = useState("");
  const [quizId, setQuizId] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    params.then(({ courseId: cId, quizId: qId }) => {
      setCourseId(cId);
      setQuizId(qId);
      fetch(`/api/student/quizzes/${qId}`)
        .then((r) => r.json())
        .then((data) => { if (data.success) setQuiz(data.data); });
    });
  }, [params]);

  function setAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!quiz) return;
    setSubmitting(true);
    setError("");
    const answerList = quiz.questions.map((q) => ({
      questionId: q.id,
      answer: answers[q.id] ?? "",
    }));
    try {
      const res = await fetch(`/api/student/quizzes/${quizId}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: answerList }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/student/courses/${courseId}/quizzes/${quizId}/results?score=${data.data.score}&passed=${data.data.passed}`);
      } else {
        setError(data.error ?? "Failed to submit quiz");
      }
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  if (!quiz) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-700 text-white px-6 py-4">
        <Link href={`/student/courses/${courseId}/quizzes`} className="text-blue-200 hover:text-white text-sm">← Quizzes</Link>
        <h1 className="text-xl font-bold mt-1">{quiz.title}</h1>
        <p className="text-blue-200 text-sm">Passing score: {quiz.passingScore}%</p>
      </div>
      <div className="max-w-3xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {quiz.questions.map((q, idx) => (
            <div key={q.id} className="bg-white rounded-xl shadow p-6">
              <p className="font-medium text-gray-800 mb-4">{idx + 1}. {q.question}</p>
              {q.type === "MCQ" && (
                <div className="space-y-2">
                  {q.options.map((opt, oi) => (
                    <label key={oi} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-blue-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                      <input type="radio" name={q.id} value={String(oi)}
                        onChange={(e) => setAnswer(q.id, e.target.value)}
                        className="text-blue-600" />
                      <span className="text-sm">{opt}</span>
                    </label>
                  ))}
                </div>
              )}
              {q.type === "TRUE_FALSE" && (
                <div className="flex gap-4">
                  {["true", "false"].map((val) => (
                    <label key={val} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                      <input type="radio" name={q.id} value={val}
                        onChange={(e) => setAnswer(q.id, e.target.value)} />
                      <span className="capitalize text-sm">{val}</span>
                    </label>
                  ))}
                </div>
              )}
              {q.type === "SHORT_ANSWER" && (
                <input type="text" placeholder="Your answer..."
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              )}
            </div>
          ))}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end">
            <button type="submit" disabled={submitting}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50">
              {submitting ? "Submitting..." : "Submit Quiz"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
