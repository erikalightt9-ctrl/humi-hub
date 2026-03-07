"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  Mail,
  Send,
  ArrowLeft,
  Trophy,
  Clock,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Users,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface EmailScenario {
  readonly type: string;
  readonly title: string;
  readonly description: string;
  readonly senderRole: string;
  readonly recipientRole: string;
}

interface EmailSession {
  readonly id: string;
  readonly scenarioType: string;
  readonly scenarioPrompt: string;
  readonly senderRole: string;
  readonly recipientRole: string;
  readonly studentEmail: string | null;
  readonly toneScore: number | null;
  readonly clarityScore: number | null;
  readonly completenessScore: number | null;
  readonly grammarScore: number | null;
  readonly industryLanguageScore: number | null;
  readonly overallScore: number | null;
  readonly aiFeedback: string | null;
  readonly suggestedVersion: string | null;
  readonly strengths: ReadonlyArray<string> | null;
  readonly improvements: ReadonlyArray<string> | null;
  readonly status: string;
  readonly createdAt: string;
  readonly evaluatedAt: string | null;
}

interface ScenarioData {
  readonly session: EmailSession;
  readonly context: string;
  readonly keyPoints: ReadonlyArray<string>;
}

type ViewState = "scenarios" | "writing" | "results";

/* ------------------------------------------------------------------ */
/*  Score helpers                                                      */
/* ------------------------------------------------------------------ */

function scoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  return "text-red-500";
}

function scoreBgColor(score: number): string {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  return "bg-red-500";
}

function scoreBadgeBg(score: number): string {
  if (score >= 80) return "bg-green-100 text-green-700";
  if (score >= 60) return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AIEmailPractice() {
  const [view, setView] = useState<ViewState>("scenarios");
  const [scenarios, setScenarios] = useState<ReadonlyArray<EmailScenario>>([]);
  const [pastSessions, setPastSessions] = useState<
    ReadonlyArray<EmailSession>
  >([]);
  const [activeScenario, setActiveScenario] = useState<ScenarioData | null>(
    null,
  );
  const [evaluatedSession, setEvaluatedSession] =
    useState<EmailSession | null>(null);
  const [subjectLine, setSubjectLine] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggested, setShowSuggested] = useState(false);

  /* ---------------------------------------------------------------- */
  /*  Fetch scenarios + past sessions                                  */
  /* ---------------------------------------------------------------- */

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/student/ai-email-practice");
      const json = await res.json();
      if (json.success) {
        setScenarios(json.data.scenarios);
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
  /*  Start scenario                                                   */
  /* ---------------------------------------------------------------- */

  const handleStartScenario = useCallback(
    async (scenarioType: string) => {
      setError(null);
      setGenerating(true);
      try {
        const res = await fetch("/api/student/ai-email-practice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scenarioType }),
        });
        const json = await res.json();
        if (json.success) {
          setActiveScenario(json.data);
          setSubjectLine("");
          setEmailBody("");
          setView("writing");
        } else {
          setError(json.error ?? "Failed to generate scenario");
        }
      } catch {
        setError("Network error.");
      } finally {
        setGenerating(false);
      }
    },
    [],
  );

  /* ---------------------------------------------------------------- */
  /*  Submit email for evaluation                                      */
  /* ---------------------------------------------------------------- */

  const handleSubmitEmail = useCallback(async () => {
    if (!activeScenario) return;

    const fullEmail = subjectLine.trim()
      ? `Subject: ${subjectLine.trim()}\n\n${emailBody}`
      : emailBody;

    if (fullEmail.length < 50) {
      setError("Email must be at least 50 characters.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/student/ai-email-practice", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: activeScenario.session.id,
          email: fullEmail,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setEvaluatedSession(json.data);
        setView("results");
      } else {
        setError(json.error ?? "Failed to evaluate email");
      }
    } catch {
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  }, [activeScenario, subjectLine, emailBody]);

  /* ---------------------------------------------------------------- */
  /*  Back to scenarios                                                */
  /* ---------------------------------------------------------------- */

  const handleBack = useCallback(() => {
    setView("scenarios");
    setActiveScenario(null);
    setEvaluatedSession(null);
    setSubjectLine("");
    setEmailBody("");
    setError(null);
    setShowSuggested(false);
    fetchData();
  }, [fetchData]);

  /* ---------------------------------------------------------------- */
  /*  Computed: email character count                                  */
  /* ---------------------------------------------------------------- */

  const fullEmailLength = subjectLine.trim()
    ? `Subject: ${subjectLine.trim()}\n\n${emailBody}`.length
    : emailBody.length;

  /* ================================================================ */
  /*  LOADING                                                          */
  /* ================================================================ */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  /* ================================================================ */
  /*  SCENARIOS VIEW                                                   */
  /* ================================================================ */

  if (view === "scenarios") {
    return (
      <div className="space-y-6">
        {/* Description */}
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
          <p className="text-sm text-blue-800">
            Practice writing professional emails for real-world VA scenarios.
            Choose a scenario below, write your email, and get instant AI
            feedback on tone, clarity, completeness, grammar, and industry
            language.
          </p>
        </div>

        {/* Scenario cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scenarios.map((scenario) => (
            <div
              key={scenario.type}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="bg-blue-50 rounded-lg p-2 mt-0.5">
                  <Mail className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {scenario.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {scenario.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                <Users className="h-3 w-3" />
                <span>
                  {scenario.senderRole} &rarr; {scenario.recipientRole}
                </span>
              </div>
              <Button
                size="sm"
                className="gap-1.5 w-full"
                onClick={() => handleStartScenario(scenario.type)}
                disabled={generating}
              >
                {generating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Mail className="h-3.5 w-3.5" />
                )}
                Start Practice
              </Button>
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {/* Practice History */}
        {pastSessions.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-3">
              Practice History
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
                        {s.scenarioType.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(s.createdAt).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" },
                        )}
                        {" \u00b7 "}
                        {s.status === "evaluated" ? "Evaluated" : "Pending"}
                      </p>
                    </div>
                  </div>
                  {s.overallScore !== null && (
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${scoreBadgeBg(s.overallScore)}`}
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
  /*  WRITING VIEW                                                     */
  /* ================================================================ */

  if (view === "writing" && activeScenario) {
    return (
      <div className="space-y-4">
        {/* Back button */}
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Scenarios
        </Button>

        {/* Scenario context card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-2">
            Scenario
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            {activeScenario.context}
          </p>

          {activeScenario.keyPoints.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Key Points to Address
              </h4>
              <ul className="space-y-1.5">
                {activeScenario.keyPoints.map((point, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-gray-600"
                  >
                    <div className="h-4 w-4 rounded border border-gray-300 flex-shrink-0 mt-0.5" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Email composition */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          {/* From / To display */}
          <div className="space-y-2 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400 font-medium w-12">From:</span>
              <span className="text-gray-700">
                {activeScenario.session.senderRole}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400 font-medium w-12">To:</span>
              <span className="text-gray-700">
                {activeScenario.session.recipientRole}
              </span>
            </div>
          </div>

          {/* Subject line */}
          <div>
            <label
              htmlFor="subject"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Subject Line
            </label>
            <input
              id="subject"
              type="text"
              value={subjectLine}
              onChange={(e) => setSubjectLine(e.target.value)}
              placeholder="Enter your email subject..."
              disabled={submitting}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200"
            />
          </div>

          {/* Email body */}
          <div>
            <label
              htmlFor="email-body"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Body
            </label>
            <textarea
              id="email-body"
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              placeholder="Write your professional email here..."
              rows={10}
              disabled={submitting}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200 resize-none"
              style={{ minHeight: "200px" }}
            />
          </div>

          {/* Character count + submit */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {fullEmailLength} characters
              {fullEmailLength > 0 && fullEmailLength < 50 && (
                <span className="text-red-400">
                  {" "}
                  (minimum 50 characters)
                </span>
              )}
            </p>
            <Button
              onClick={handleSubmitEmail}
              disabled={submitting || fullEmailLength < 50}
              className="gap-1.5"
            >
              {submitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              {submitting ? "Evaluating..." : "Submit for AI Review"}
            </Button>
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  /* ================================================================ */
  /*  RESULTS VIEW                                                     */
  /* ================================================================ */

  if (view === "results" && evaluatedSession) {
    const dimensions = [
      {
        label: "Tone & Professionalism",
        score: evaluatedSession.toneScore,
      },
      {
        label: "Clarity & Structure",
        score: evaluatedSession.clarityScore,
      },
      {
        label: "Completeness",
        score: evaluatedSession.completenessScore,
      },
      {
        label: "Grammar & Spelling",
        score: evaluatedSession.grammarScore,
      },
      {
        label: "Industry Language",
        score: evaluatedSession.industryLanguageScore,
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
                Email Evaluation Results
              </h2>
              <p className="text-xs text-gray-500">
                {evaluatedSession.scenarioType.replace(/_/g, " ")}
              </p>
            </div>
          </div>

          {/* Overall score */}
          {evaluatedSession.overallScore !== null && (
            <div className="text-center mb-6 py-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Overall Score
              </p>
              <p
                className={`text-5xl font-bold ${scoreColor(evaluatedSession.overallScore)}`}
              >
                {evaluatedSession.overallScore}
              </p>
              <p className="text-xs text-gray-400 mt-1">out of 100</p>
            </div>
          )}

          {/* Dimension score bars */}
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
          {evaluatedSession.aiFeedback && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 mb-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-1">
                AI Feedback
              </h4>
              <p className="text-sm text-blue-800 leading-relaxed">
                {evaluatedSession.aiFeedback}
              </p>
            </div>
          )}

          {/* Strengths */}
          {evaluatedSession.strengths &&
            evaluatedSession.strengths.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  Strengths
                </h4>
                <ul className="space-y-1.5">
                  {evaluatedSession.strengths.map((s, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-gray-700"
                    >
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {/* Improvements */}
          {evaluatedSession.improvements &&
            evaluatedSession.improvements.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  Areas for Improvement
                </h4>
                <ul className="space-y-1.5">
                  {evaluatedSession.improvements.map((imp, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-gray-700"
                    >
                      <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                      {imp}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {/* Collapsible AI-Improved Version */}
          {evaluatedSession.suggestedVersion && (
            <div className="border border-gray-200 rounded-lg mb-4">
              <button
                type="button"
                onClick={() => setShowSuggested((prev) => !prev)}
                className="w-full flex items-center justify-between p-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors rounded-lg"
              >
                <span>View AI-Improved Version</span>
                {showSuggested ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </button>
              {showSuggested && (
                <div className="px-3 pb-3 border-t border-gray-100">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed mt-3 bg-gray-50 rounded-lg p-4">
                    {evaluatedSession.suggestedVersion}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Practice Another */}
          <Button onClick={handleBack} className="gap-1.5">
            <RotateCcw className="h-4 w-4" />
            Practice Another Email
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
