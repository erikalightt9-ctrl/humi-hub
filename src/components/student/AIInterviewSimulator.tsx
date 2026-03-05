"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  Mic,
  Send,
  ArrowLeft,
  Trophy,
  Clock,
  Briefcase,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface InterviewRole {
  readonly id: string;
  readonly title: string;
  readonly description: string;
}

interface InterviewQuestion {
  readonly question: string;
  readonly answer: string | null;
  readonly aiFollowUp: string | null;
  readonly score: number | null;
}

interface InterviewSession {
  readonly id: string;
  readonly role: string;
  readonly courseSlug: string;
  readonly questions: ReadonlyArray<InterviewQuestion>;
  readonly status: string;
  readonly overallScore: number | null;
  readonly communicationScore: number | null;
  readonly knowledgeScore: number | null;
  readonly problemSolvingScore: number | null;
  readonly professionalismScore: number | null;
  readonly aiFeedback: string | null;
  readonly createdAt: string;
  readonly completedAt: string | null;
}

type ViewState = "roles" | "interview" | "results";

/* ------------------------------------------------------------------ */
/*  Score helpers                                                      */
/* ------------------------------------------------------------------ */

function scoreColor(score: number): string {
  if (score >= 75) return "text-green-600";
  if (score >= 50) return "text-yellow-600";
  return "text-red-500";
}

function scoreBgColor(score: number): string {
  if (score >= 75) return "bg-green-500";
  if (score >= 50) return "bg-yellow-500";
  return "bg-red-500";
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AIInterviewSimulator() {
  const [view, setView] = useState<ViewState>("roles");
  const [roles, setRoles] = useState<ReadonlyArray<InterviewRole>>([]);
  const [pastSessions, setPastSessions] = useState<
    ReadonlyArray<InterviewSession>
  >([]);
  const [activeSession, setActiveSession] =
    useState<InterviewSession | null>(null);
  const [activeRole, setActiveRole] = useState<InterviewRole | null>(
    null,
  );
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---------------------------------------------------------------- */
  /*  Fetch roles + past sessions                                      */
  /* ---------------------------------------------------------------- */

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/student/ai-interviews");
      const json = await res.json();
      if (json.success) {
        setRoles(json.data.roles);
        setPastSessions(json.data.sessions);
      } else {
        setError(json.error ?? "Failed to load data");
      }
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ---------------------------------------------------------------- */
  /*  Start interview                                                  */
  /* ---------------------------------------------------------------- */

  const handleStart = useCallback(async (roleId: string) => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/student/ai-interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", role: roleId }),
      });
      const json = await res.json();
      if (json.success) {
        setActiveSession(json.data.session);
        setActiveRole(json.data.role);
        setView("interview");
      } else {
        setError(json.error ?? "Failed to start interview");
      }
    } catch {
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Submit answer                                                    */
  /* ---------------------------------------------------------------- */

  const handleAnswer = useCallback(async () => {
    if (!activeSession || answer.trim().length < 10) return;
    setSubmitting(true);
    setError(null);
    const currentAnswer = answer;
    setAnswer("");

    try {
      const res = await fetch("/api/student/ai-interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "answer",
          sessionId: activeSession.id,
          answer: currentAnswer,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setActiveSession(json.data);
      } else {
        setError(json.error ?? "Failed to submit answer");
        setAnswer(currentAnswer);
      }
    } catch {
      setError("Network error.");
      setAnswer(currentAnswer);
    } finally {
      setSubmitting(false);
    }
  }, [activeSession, answer]);

  /* ---------------------------------------------------------------- */
  /*  End interview                                                    */
  /* ---------------------------------------------------------------- */

  const handleEnd = useCallback(async () => {
    if (!activeSession) return;
    setEnding(true);
    setError(null);

    try {
      const res = await fetch("/api/student/ai-interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "end",
          sessionId: activeSession.id,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setActiveSession(json.data);
        setView("results");
      } else {
        setError(json.error ?? "Failed to end interview");
      }
    } catch {
      setError("Network error.");
    } finally {
      setEnding(false);
    }
  }, [activeSession]);

  /* ---------------------------------------------------------------- */
  /*  Back to roles                                                    */
  /* ---------------------------------------------------------------- */

  const handleBack = useCallback(() => {
    setView("roles");
    setActiveSession(null);
    setActiveRole(null);
    setAnswer("");
    setError(null);
    fetchData();
  }, [fetchData]);

  /* ---------------------------------------------------------------- */
  /*  Derived state for interview view                                 */
  /* ---------------------------------------------------------------- */

  const currentQuestionIndex = activeSession
    ? activeSession.questions.length
    : 0;

  const currentQuestion = activeSession
    ? activeSession.questions[activeSession.questions.length - 1]
    : null;

  const allAnswered =
    activeSession !== null &&
    activeSession.questions.length > 0 &&
    activeSession.questions.every((q) => q.answer !== null);

  const isInterviewComplete = currentQuestionIndex >= 5 && allAnswered;

  /* ================================================================ */
  /*  LOADING                                                          */
  /* ================================================================ */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  /* ================================================================ */
  /*  ROLES SELECTION VIEW                                             */
  /* ================================================================ */

  if (view === "roles") {
    return (
      <div className="space-y-6">
        {/* Role cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((role) => (
            <div
              key={role.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-purple-300 transition-colors"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="bg-purple-50 rounded-lg p-2 mt-0.5">
                  <Briefcase className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {role.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {role.description}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => handleStart(role.id)}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Mic className="h-3.5 w-3.5" />
                )}
                Start Interview
              </Button>
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {/* Past sessions */}
        {pastSessions.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-3">
              Past Interviews
            </h3>
            <div className="space-y-2">
              {pastSessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-700">
                        {s.role.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(s.createdAt).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" },
                        )}
                        {" \u00b7 "}
                        {
                          s.questions.filter((q) => q.answer !== null)
                            .length
                        }{" "}
                        questions answered
                      </p>
                    </div>
                  </div>
                  {s.overallScore !== null && (
                    <span
                      className={`text-sm font-semibold ${scoreColor(s.overallScore)}`}
                    >
                      {s.overallScore}/100
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ================================================================ */
  /*  ACTIVE INTERVIEW VIEW                                            */
  /* ================================================================ */

  if (view === "interview" && activeSession) {
    return (
      <div className="space-y-4">
        {/* Interview header */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h3 className="font-semibold text-gray-900">
                {activeRole?.title ?? "Interview"}
              </h3>
              <p className="text-xs text-gray-500">
                Question {Math.min(currentQuestionIndex, 5)} of 5
                {isInterviewComplete && " \u00b7 Complete"}
              </p>
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => {
              const q = activeSession.questions[i];
              const isAnswered = q?.answer !== null;
              const isCurrent = i === activeSession.questions.length - 1;
              return (
                <div
                  key={i}
                  className={`h-2.5 w-2.5 rounded-full transition-colors ${
                    isAnswered
                      ? "bg-purple-600"
                      : isCurrent
                        ? "bg-purple-300 animate-pulse"
                        : "bg-gray-200"
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Question & Answer area */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          {/* Show past Q&A */}
          {activeSession.questions.slice(0, -1).map((q, i) => (
            <div key={i} className="space-y-2 pb-4 border-b border-gray-100">
              <div className="flex items-start gap-2">
                <div className="bg-purple-50 rounded-full p-1 mt-0.5">
                  <Briefcase className="h-3 w-3 text-purple-600" />
                </div>
                <p className="text-sm text-gray-800 font-medium">
                  Q{i + 1}: {q.question}
                </p>
              </div>
              {q.answer && (
                <div className="flex items-start gap-2 ml-6">
                  <CheckCircle className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-600">{q.answer}</p>
                </div>
              )}
              {q.aiFollowUp && (
                <p className="text-xs text-purple-600 ml-6 italic">
                  {q.aiFollowUp}
                </p>
              )}
              {q.score !== null && (
                <p className="text-xs text-gray-400 ml-6">
                  Score: {q.score}/100
                </p>
              )}
            </div>
          ))}

          {/* Current question */}
          {currentQuestion && currentQuestion.answer === null && (
            <div className="space-y-4">
              <div className="flex items-start gap-2">
                <div className="bg-purple-100 rounded-full p-1.5 mt-0.5">
                  <Briefcase className="h-3.5 w-3.5 text-purple-700" />
                </div>
                <div>
                  <p className="text-xs text-purple-600 font-medium mb-1">
                    Question {currentQuestionIndex} of 5
                  </p>
                  <p className="text-gray-900 font-medium">
                    {currentQuestion.question}
                  </p>
                </div>
              </div>

              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer here... (minimum 10 characters)"
                rows={4}
                disabled={submitting}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-purple-300 focus:ring-1 focus:ring-purple-200 resize-none"
              />

              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  {answer.length} characters
                  {answer.length > 0 && answer.length < 10 && (
                    <span className="text-red-400">
                      {" "}
                      (minimum 10)
                    </span>
                  )}
                </p>
                <Button
                  size="sm"
                  onClick={handleAnswer}
                  disabled={
                    submitting || answer.trim().length < 10
                  }
                  className="gap-1.5"
                >
                  {submitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  Submit Answer
                </Button>
              </div>
            </div>
          )}

          {/* Interview complete - prompt to end */}
          {isInterviewComplete && (
            <div className="text-center py-4 space-y-3">
              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-800">
                  All 5 questions answered!
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Click below to get your interview scored by AI.
                </p>
              </div>
              <Button
                onClick={handleEnd}
                disabled={ending}
                className="gap-1.5"
              >
                {ending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trophy className="h-3.5 w-3.5" />
                )}
                {ending ? "Scoring Interview..." : "Get Interview Results"}
              </Button>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  /* ================================================================ */
  /*  RESULTS VIEW                                                     */
  /* ================================================================ */

  if (view === "results" && activeSession) {
    const dimensions = [
      {
        label: "Communication",
        score: activeSession.communicationScore,
      },
      { label: "Knowledge", score: activeSession.knowledgeScore },
      {
        label: "Problem Solving",
        score: activeSession.problemSolvingScore,
      },
      {
        label: "Professionalism",
        score: activeSession.professionalismScore,
      },
    ];

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {/* Results header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-amber-100 rounded-lg p-2">
              <Trophy className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">
                Interview Results
              </h2>
              <p className="text-xs text-gray-500">
                {activeRole?.title ?? "Interview"} &middot;{" "}
                {
                  activeSession.questions.filter(
                    (q) => q.answer !== null,
                  ).length
                }{" "}
                questions answered
              </p>
            </div>
          </div>

          {/* Overall score */}
          {activeSession.overallScore !== null && (
            <div className="text-center mb-6 py-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Overall Score
              </p>
              <p
                className={`text-5xl font-bold ${scoreColor(activeSession.overallScore)}`}
              >
                {activeSession.overallScore}
              </p>
              <p className="text-xs text-gray-400 mt-1">out of 100</p>
            </div>
          )}

          {/* Dimension scores as bars */}
          <div className="space-y-3 mb-6">
            {dimensions.map((dim) => (
              <div key={dim.label}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-gray-700">{dim.label}</p>
                  <p
                    className={`text-sm font-semibold ${
                      dim.score !== null
                        ? scoreColor(dim.score)
                        : "text-gray-300"
                    }`}
                  >
                    {dim.score ?? "\u2014"}/100
                  </p>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                      dim.score !== null
                        ? scoreBgColor(dim.score)
                        : "bg-gray-200"
                    }`}
                    style={{ width: `${dim.score ?? 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* AI Feedback */}
          {activeSession.aiFeedback && (
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-100 mb-4">
              <h4 className="text-sm font-semibold text-purple-900 mb-1">
                AI Feedback
              </h4>
              <p className="text-sm text-purple-800 leading-relaxed">
                {activeSession.aiFeedback}
              </p>
            </div>
          )}

          <Button onClick={handleBack} className="gap-1.5">
            <Mic className="h-4 w-4" />
            Start New Interview
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
