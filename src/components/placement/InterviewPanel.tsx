"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { InterviewFeedback, type FeedbackData } from "./InterviewFeedback";

type Step = "role" | "questions" | "submitting" | "feedback";

interface Question {
  readonly id: string;
  readonly question: string;
  readonly order: number;
}

export function InterviewPanel() {
  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState("");
  const [roleError, setRoleError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartInterview = useCallback(async () => {
    if (!role.trim()) {
      setRoleError("Please enter a job role to continue.");
      return;
    }
    setRoleError(null);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/placement/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: role.trim() }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error ?? "Failed to start interview. Please try again.");
        return;
      }

      setSessionId(json.data.session.id);
      setQuestions(json.data.questions);
      setCurrentIndex(0);
      setAnswers({});
      setStep("questions");
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [role]);

  const handleAnswer = useCallback((questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, questions.length]);

  const handleSubmitFeedback = useCallback(async () => {
    if (!sessionId) return;
    setStep("submitting");
    setLoading(true);
    setError(null);

    const answersPayload = questions.map((q) => ({
      questionId: q.id,
      answer: answers[q.id] ?? "",
    }));

    try {
      const res = await fetch("/api/placement/interview/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, answers: answersPayload }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error ?? "Failed to get feedback. Please try again.");
        setStep("questions");
        return;
      }

      setFeedback({
        aiFeedback: json.data.aiFeedback,
        overallScore: json.data.overallScore,
        communicationScore: json.data.communicationScore,
        knowledgeScore: json.data.knowledgeScore,
        problemSolvingScore: json.data.problemSolvingScore,
        professionalismScore: json.data.professionalismScore,
      });
      setStep("feedback");
    } catch {
      setError("Network error. Please check your connection and try again.");
      setStep("questions");
    } finally {
      setLoading(false);
    }
  }, [sessionId, questions, answers]);

  const handleReset = useCallback(() => {
    setStep("role");
    setRole("");
    setRoleError(null);
    setSessionId(null);
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers({});
    setFeedback(null);
    setError(null);
    setLoading(false);
  }, []);

  const currentQuestion = questions[currentIndex] ?? null;
  const isLastQuestion = currentIndex === questions.length - 1;
  const allAnswered = questions.every((q) => (answers[q.id] ?? "").trim().length > 0);

  if (step === "role") {
    return (
      <div className="space-y-5">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
            {error}
          </div>
        )}
        <div className="flex flex-col gap-1">
          <label htmlFor="role" className="text-sm font-medium text-gray-700">
            Job Role / Position
          </label>
          <input
            id="role"
            type="text"
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setRoleError(null);
            }}
            onKeyDown={(e) => { if (e.key === "Enter") handleStartInterview(); }}
            placeholder="e.g. Medical Virtual Assistant"
            className={`rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-blue-500 ${
              roleError ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
            }`}
          />
          {roleError && <p className="text-xs text-red-500 mt-0.5">{roleError}</p>}
        </div>
        <Button onClick={handleStartInterview} disabled={loading} size="lg">
          {loading ? "Starting..." : "Start Interview"}
        </Button>
      </div>
    );
  }

  if (step === "questions" && currentQuestion) {
    return (
      <div className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
            {error}
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-blue-600">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <div className="flex gap-1">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-8 rounded-full transition-colors ${
                  i < currentIndex ? "bg-blue-500" : i === currentIndex ? "bg-blue-300" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-blue-50 border border-blue-100 px-5 py-4">
          <p className="text-gray-800 font-medium leading-relaxed">{currentQuestion.question}</p>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={`answer-${currentQuestion.id}`} className="text-sm font-medium text-gray-700">
            Your Answer
          </label>
          <textarea
            id={`answer-${currentQuestion.id}`}
            rows={5}
            value={answers[currentQuestion.id] ?? ""}
            onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
            placeholder="Type your answer here..."
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="flex items-center gap-3">
          {!isLastQuestion ? (
            <Button onClick={handleNext} disabled={!(answers[currentQuestion.id] ?? "").trim()}>
              Next Question <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmitFeedback}
              disabled={!allAnswered}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Submit &amp; Get Feedback
            </Button>
          )}
          <button type="button" onClick={handleReset} className="text-sm text-gray-500 hover:text-gray-700 underline">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (step === "submitting") {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-600 text-sm font-medium">Analyzing your responses...</p>
        </div>
      </div>
    );
  }

  if (step === "feedback" && feedback) {
    return <InterviewFeedback feedback={feedback} onReset={handleReset} />;
  }

  return null;
}
