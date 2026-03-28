"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Clock, ShieldAlert, CheckCircle } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Question {
  id: string;
  type: string;
  question: string;
  options: string[];
  points: number;
  order: number;
}

type Phase = "loading" | "ready" | "active" | "submitted" | "error";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(ms: number): string {
  if (ms <= 0) return "0:00";
  const totalSec = Math.ceil(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TakeQuizPage({
  params,
}: {
  params: Promise<{ courseId: string; quizId: string }>;
}) {
  const router = useRouter();

  // Route params
  const [courseId, setCourseId] = useState("");
  const [quizId, setQuizId] = useState("");

  // Quiz metadata
  const [quizTitle, setQuizTitle] = useState("");
  const [quizPassingScore, setQuizPassingScore] = useState(70);
  const [hasDuration, setHasDuration] = useState(false);

  // Page state
  const [phase, setPhase] = useState<Phase>("loading");
  const [alreadyAttempted, setAlreadyAttempted] = useState(false);
  const [error, setError] = useState("");

  // Attempt state
  const [attemptId, setAttemptId] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [violations, setViolations] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Refs for stable access inside event listeners / intervals
  const attemptIdRef = useRef("");
  const quizIdRef = useRef("");
  const courseIdRef = useRef("");
  const isSubmittedRef = useRef(false);
  const answersRef = useRef<Record<string, string>>({});
  const questionsRef = useRef<Question[]>([]);

  // Keep refs in sync
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { questionsRef.current = questions; }, [questions]);

  // -------------------------------------------------------------------------
  // Load quiz info on mount
  // -------------------------------------------------------------------------
  useEffect(() => {
    params.then(({ courseId: cId, quizId: qId }) => {
      setCourseId(cId);
      setQuizId(qId);
      quizIdRef.current = qId;
      courseIdRef.current = cId;

      // Fetch quiz metadata (title, passingScore, duration)
      fetch(`/api/student/quizzes/${qId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.data) {
            setQuizTitle(data.data.title);
            setQuizPassingScore(data.data.passingScore);
            setHasDuration(data.data.duration != null);
          }
        })
        .catch(() => {});

      // POST /start → returns attempt (creates or resumes)
      fetch(`/api/student/quizzes/${qId}/start`, { method: "POST" })
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            const { attemptId: aId, questions: qs, remainingMs: rMs, isResumed } = data.data;
            setAttemptId(aId);
            attemptIdRef.current = aId;
            setQuestions(qs);
            questionsRef.current = qs;
            if (rMs != null) setRemainingMs(rMs);
            setPhase(isResumed ? "active" : "ready");
          } else if (data.error === "You have already completed this quiz") {
            setAlreadyAttempted(true);
            setPhase("submitted");
          } else {
            setError(data.error ?? "Failed to load quiz");
            setPhase("error");
          }
        })
        .catch(() => {
          setError("Network error. Please refresh and try again.");
          setPhase("error");
        });
    });
  }, [params]);

  // -------------------------------------------------------------------------
  // Countdown timer (only active when phase === "active")
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (phase !== "active" || remainingMs === null) return;

    const interval = setInterval(() => {
      setRemainingMs((prev) => {
        if (prev === null) return null;
        const next = prev - 1000;
        if (next <= 0) {
          clearInterval(interval);
          if (!isSubmittedRef.current) {
            doSubmit(true);
          }
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // -------------------------------------------------------------------------
  // Anti-cheat: record tab-switch / window-blur violations
  // -------------------------------------------------------------------------
  const sendViolation = useCallback(async () => {
    const aId = attemptIdRef.current;
    const qId = quizIdRef.current;
    const cId = courseIdRef.current;
    if (!aId || !qId || isSubmittedRef.current) return;

    try {
      const res = await fetch(`/api/student/quizzes/${qId}/violation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId: aId }),
      });
      const data = await res.json();
      if (data.success) {
        setViolations(data.data.violations);
        if (data.data.autoSubmitted) {
          isSubmittedRef.current = true;
          const score = data.data.score ?? 0;
          const passed = data.data.passed ?? false;
          router.push(
            `/student/courses/${cId}/quizzes/${qId}/results?score=${score}&passed=${passed}&autoSubmit=true`
          );
        }
      }
    } catch {
      // Non-critical — don't surface to user
    }
  }, [router]);

  useEffect(() => {
    if (phase !== "active") return;
    const onVisChange = () => { if (document.hidden) sendViolation(); };
    const onBlur = () => sendViolation();
    document.addEventListener("visibilitychange", onVisChange);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("visibilitychange", onVisChange);
      window.removeEventListener("blur", onBlur);
    };
  }, [phase, sendViolation]);

  // -------------------------------------------------------------------------
  // Submit
  // -------------------------------------------------------------------------
  const doSubmit = useCallback(async (isAuto: boolean) => {
    const aId = attemptIdRef.current;
    const qId = quizIdRef.current;
    const cId = courseIdRef.current;
    if (!aId || !qId || isSubmittedRef.current) return;
    isSubmittedRef.current = true;
    setSubmitting(true);

    const answerList = questionsRef.current.map((q) => ({
      questionId: q.id,
      answer: answersRef.current[q.id] ?? "",
    }));

    try {
      const res = await fetch(`/api/student/quizzes/${qId}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId: aId, answers: answerList }),
      });
      const data = await res.json();
      if (data.success) {
        const { score, passed, correct, total } = data.data;
        router.push(
          `/student/courses/${cId}/quizzes/${qId}/results?score=${score}&passed=${passed}&correct=${correct}&total=${total}${isAuto ? "&autoSubmit=true" : ""}`
        );
      } else {
        setError(data.error ?? "Submission failed");
        setSubmitting(false);
        isSubmittedRef.current = false;
      }
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
      isSubmittedRef.current = false;
    }
  }, [router]);

  function setAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  // -------------------------------------------------------------------------
  // Timer styling
  // -------------------------------------------------------------------------
  const timerUrgent = remainingMs !== null && remainingMs < 60_000;

  // =========================================================================
  // Render
  // =========================================================================

  if (phase === "loading") {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        Loading…
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-sm text-center">
          <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-3" />
          <p className="text-gray-700 mb-4">{error}</p>
          <Link
            href={`/student/courses/${courseId}/quizzes`}
            className="text-blue-600 text-sm hover:underline"
          >
            ← Back to Quizzes
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "submitted" && alreadyAttempted) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-sm text-center">
          <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Already Completed
          </h2>
          <p className="text-gray-500 text-sm mb-5">
            You have already submitted this quiz. Only one attempt is allowed.
          </p>
          <Link
            href={`/student/courses/${courseId}/quizzes`}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
          >
            Back to Quizzes
          </Link>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Ready screen
  // -------------------------------------------------------------------------
  if (phase === "ready") {
    return (
      <div className="space-y-6">
        <div>
          <Link
            href={`/student/courses/${courseId}/quizzes`}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            ← Back to Quizzes
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">{quizTitle}</h1>
          <p className="text-gray-500 text-sm mt-1">
            Passing score: {quizPassingScore}%
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-lg">
          <h2 className="font-bold text-gray-800 text-lg mb-4">Before you begin</h2>
          <ul className="space-y-3 text-sm text-gray-600 mb-6">
            <li className="flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
              <span>
                You have <strong>1 attempt only</strong>. This cannot be retaken.
              </span>
            </li>
            {hasDuration && (
              <li className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                <span>
                  A countdown timer will start immediately. The quiz{" "}
                  <strong>auto-submits</strong> when time runs out.
                </span>
              </li>
            )}
            <li className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
              <span>
                Switching tabs or leaving the window is a violation.{" "}
                <strong>3 violations = auto-submit.</strong>
              </span>
            </li>
          </ul>
          <button
            onClick={() => setPhase("active")}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
          >
            Start Quiz
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Active quiz
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href={`/student/courses/${courseId}/quizzes`}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            ← Back to Quizzes
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">{quizTitle}</h1>
          <p className="text-gray-500 text-sm mt-1">
            Passing score: {quizPassingScore}%
          </p>
        </div>

        <div className="flex items-center gap-3 mt-1 shrink-0">
          {violations > 0 && (
            <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold px-3 py-1.5 rounded-full">
              <AlertTriangle className="h-3.5 w-3.5" />
              {violations}/3 violations
            </div>
          )}
          {remainingMs !== null && (
            <div
              className={`flex items-center gap-1.5 font-mono font-bold text-lg ${
                timerUrgent ? "text-red-600 animate-pulse" : "text-gray-700"
              }`}
            >
              <Clock className="h-5 w-5" />
              {formatTime(remainingMs)}
            </div>
          )}
        </div>
      </div>

      {/* Questions */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          doSubmit(false);
        }}
        className="space-y-6"
      >
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="font-medium text-gray-800 mb-4">
              {idx + 1}. {q.question}
            </p>

            {q.type === "MCQ" && (
              <div className="space-y-2">
                {q.options.map((opt, oi) => (
                  <label
                    key={oi}
                    className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-blue-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50"
                  >
                    <input
                      type="radio"
                      name={q.id}
                      value={String(oi)}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                      className="text-blue-600"
                    />
                    <span className="text-sm">{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === "TRUE_FALSE" && (
              <div className="flex gap-4">
                {["true", "false"].map((val) => (
                  <label
                    key={val}
                    className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50"
                  >
                    <input
                      type="radio"
                      name={q.id}
                      value={val}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                    />
                    <span className="capitalize text-sm">{val}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === "SHORT_ANSWER" && (
              <input
                type="text"
                placeholder="Your answer…"
                onChange={(e) => setAnswer(q.id, e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>
        ))}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit Quiz"}
          </button>
        </div>
      </form>
    </div>
  );
}
