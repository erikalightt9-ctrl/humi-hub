"use client";

import { useState, useCallback } from "react";
import {
  Zap,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  BarChart3,
  Send,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface GeneratedTask {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly instructions: string;
  readonly difficulty: "beginner" | "intermediate" | "advanced";
  readonly estimatedMinutes: number;
  readonly skills: ReadonlyArray<string>;
}

interface TaskFeedback {
  readonly score: number;
  readonly feedback: string;
  readonly strengths: ReadonlyArray<string>;
  readonly improvements: ReadonlyArray<string>;
}

type Difficulty = "beginner" | "intermediate" | "advanced";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function difficultyColor(d: string): string {
  if (d === "beginner") return "bg-green-100 text-green-700";
  if (d === "intermediate") return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  return "text-red-500";
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AITaskGenerator() {
  const [difficulty, setDifficulty] = useState<Difficulty>("intermediate");
  const [task, setTask] = useState<GeneratedTask | null>(null);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<TaskFeedback | null>(null);
  const [generating, setGenerating] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setError(null);
    setTask(null);
    setAnswer("");
    setFeedback(null);

    try {
      const res = await fetch("/api/student/ai-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficulty }),
      });
      const json = await res.json();

      if (json.success) {
        setTask(json.data);
      } else {
        setError(json.error ?? "Failed to generate task");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setGenerating(false);
    }
  }, [difficulty]);

  const handleSubmit = useCallback(async () => {
    if (!task || answer.trim().length < 10) return;

    setEvaluating(true);
    setError(null);

    try {
      const res = await fetch("/api/student/ai-tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, answer }),
      });
      const json = await res.json();

      if (json.success) {
        setFeedback(json.data);
      } else {
        setError(json.error ?? "Failed to evaluate answer");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setEvaluating(false);
    }
  }, [task, answer]);

  return (
    <div className="space-y-6">
      {/* Difficulty Selector + Generate */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-indigo-100 rounded-lg p-2">
            <Zap className="h-5 w-5 text-indigo-700" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Generate a Task</h2>
            <p className="text-xs text-gray-500">
              AI creates a realistic practice task for your course
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-2">
            {(["beginner", "intermediate", "advanced"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  difficulty === d
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="gap-1.5"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            {generating ? "Generating..." : "Generate Task"}
          </Button>
        </div>

        {error && !task && (
          <p className="text-sm text-red-500 mt-3">{error}</p>
        )}
      </div>

      {/* Generated Task */}
      {task && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 text-lg">
              {task.title}
            </h3>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${difficultyColor(task.difficulty)}`}
              >
                {task.difficulty}
              </span>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {task.estimatedMinutes} min
              </span>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4">{task.description}</p>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Instructions
            </h4>
            <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
              {task.instructions}
            </p>
          </div>

          {task.skills.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <BarChart3 className="h-3.5 w-3.5 text-gray-400" />
              {task.skills.map((skill, i) => (
                <span
                  key={i}
                  className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}

          {/* Answer area */}
          {!feedback && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900">
                Your Answer
              </h4>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer here... Be detailed and professional."
                rows={6}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {answer.length} characters (min 10)
                </span>
                <Button
                  onClick={handleSubmit}
                  disabled={evaluating || answer.trim().length < 10}
                  className="gap-1.5"
                >
                  {evaluating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {evaluating ? "Evaluating..." : "Submit for AI Review"}
                </Button>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          )}

          {/* Feedback */}
          {feedback && (
            <div className="space-y-4 border-t border-gray-200 pt-4 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-indigo-600" />
                  <h4 className="text-sm font-semibold text-gray-900">
                    AI Feedback
                  </h4>
                </div>
                <span
                  className={`text-2xl font-bold ${scoreColor(feedback.score)}`}
                >
                  {feedback.score}/100
                </span>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed">
                {feedback.feedback}
              </p>

              {feedback.strengths.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-green-700 mb-1.5">
                    Strengths
                  </p>
                  <div className="space-y-1">
                    {feedback.strengths.map((s, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-sm text-gray-600"
                      >
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                        {s}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {feedback.improvements.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-orange-700 mb-1.5">
                    Areas for Improvement
                  </p>
                  <div className="space-y-1">
                    {feedback.improvements.map((imp, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-sm text-gray-600"
                      >
                        <AlertCircle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                        {imp}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Try another task */}
              <Button
                variant="outline"
                onClick={handleGenerate}
                disabled={generating}
                className="gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Generate Another Task
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
