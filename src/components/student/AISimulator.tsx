"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Users,
  Loader2,
  Send,
  StopCircle,
  ArrowLeft,
  Trophy,
  MessageSquare,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Scenario {
  readonly id: string;
  readonly title: string;
  readonly description: string;
}

interface SimMessage {
  readonly role: "client" | "student";
  readonly content: string;
  readonly timestamp: string;
}

interface Session {
  readonly id: string;
  readonly scenario: string;
  readonly status: string;
  readonly messages: ReadonlyArray<SimMessage>;
  readonly communicationScore: number | null;
  readonly problemSolvingScore: number | null;
  readonly professionalismScore: number | null;
  readonly overallScore: number | null;
  readonly aiFeedback: string | null;
  readonly createdAt: string;
  readonly completedAt: string | null;
}

type ViewState = "scenarios" | "chat" | "results";

/* ------------------------------------------------------------------ */
/*  Score color                                                        */
/* ------------------------------------------------------------------ */

function scoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  return "text-red-500";
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AISimulator() {
  const [view, setView] = useState<ViewState>("scenarios");
  const [scenarios, setScenarios] = useState<ReadonlyArray<Scenario>>([]);
  const [pastSessions, setPastSessions] = useState<ReadonlyArray<Session>>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch scenarios + past sessions
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/student/ai-simulator");
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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.messages]);

  // Start simulation
  const handleStart = useCallback(async (scenarioId: string) => {
    setError(null);
    setSending(true);
    try {
      const res = await fetch("/api/student/ai-simulator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", scenarioId }),
      });
      const json = await res.json();
      if (json.success) {
        setActiveSession(json.data.session);
        setActiveScenario(json.data.scenario);
        setView("chat");
      } else {
        setError(json.error ?? "Failed to start simulation");
      }
    } catch {
      setError("Network error.");
    } finally {
      setSending(false);
    }
  }, []);

  // Send message
  const handleSend = useCallback(async () => {
    if (!activeSession || message.trim().length < 1) return;
    setSending(true);
    setError(null);
    const msg = message;
    setMessage("");

    try {
      const res = await fetch("/api/student/ai-simulator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "message",
          sessionId: activeSession.id,
          message: msg,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setActiveSession(json.data);
      } else {
        setError(json.error ?? "Failed to send message");
        setMessage(msg);
      }
    } catch {
      setError("Network error.");
      setMessage(msg);
    } finally {
      setSending(false);
    }
  }, [activeSession, message]);

  // End simulation
  const handleEnd = useCallback(async () => {
    if (!activeSession) return;
    setEnding(true);
    setError(null);

    try {
      const res = await fetch("/api/student/ai-simulator", {
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
        setError(json.error ?? "Failed to end simulation");
      }
    } catch {
      setError("Network error.");
    } finally {
      setEnding(false);
    }
  }, [activeSession]);

  // Back to scenarios
  const handleBack = useCallback(() => {
    setView("scenarios");
    setActiveSession(null);
    setActiveScenario(null);
    setMessage("");
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  /* ============ SCENARIO SELECTION VIEW ============ */
  if (view === "scenarios") {
    return (
      <div className="space-y-6">
        {/* Scenario cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scenarios.map((scenario) => (
            <div
              key={scenario.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 mb-1">
                {scenario.title}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {scenario.description}
              </p>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => handleStart(scenario.id)}
                disabled={sending}
              >
                {sending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <MessageSquare className="h-3.5 w-3.5" />
                )}
                Start Simulation
              </Button>
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {/* Past sessions */}
        {pastSessions.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-3">
              Past Simulations
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
                        {s.scenario}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(s.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                        {" · "}
                        {s.messages.length} messages
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

  /* ============ CHAT VIEW ============ */
  if (view === "chat" && activeSession) {
    return (
      <div className="space-y-4">
        {/* Chat header */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h3 className="font-semibold text-gray-900">
                {activeScenario?.title ?? "Simulation"}
              </h3>
              <p className="text-xs text-gray-500">
                {activeSession.messages.length} messages · Active
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
            onClick={handleEnd}
            disabled={ending || activeSession.messages.length < 2}
          >
            {ending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <StopCircle className="h-3.5 w-3.5" />
            )}
            {ending ? "Scoring..." : "End & Score"}
          </Button>
        </div>

        {/* Messages */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 min-h-[400px] max-h-[500px] overflow-y-auto space-y-3">
          {activeSession.messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "student" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2.5 ${
                  msg.role === "student"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                <p className="text-xs font-medium mb-0.5 opacity-70">
                  {msg.role === "client" ? "Client" : "You"}
                </p>
                <p className="text-sm leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white rounded-xl border border-gray-200 p-3 flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your response as the VA..."
            disabled={sending}
            className="flex-1 text-sm border-none outline-none px-2"
          />
          <Button
            size="sm"
            onClick={handleSend}
            disabled={sending || message.trim().length < 1}
            className="gap-1.5"
          >
            {sending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  /* ============ RESULTS VIEW ============ */
  if (view === "results" && activeSession) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-amber-100 rounded-lg p-2">
              <Trophy className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">
                Simulation Results
              </h2>
              <p className="text-xs text-gray-500">
                {activeScenario?.title ?? "Simulation"} ·{" "}
                {activeSession.messages.length} messages exchanged
              </p>
            </div>
          </div>

          {/* Scores */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Communication", score: activeSession.communicationScore },
              { label: "Problem Solving", score: activeSession.problemSolvingScore },
              { label: "Professionalism", score: activeSession.professionalismScore },
              { label: "Overall", score: activeSession.overallScore },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100"
              >
                <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                <p
                  className={`text-2xl font-bold ${
                    item.score !== null
                      ? scoreColor(item.score)
                      : "text-gray-300"
                  }`}
                >
                  {item.score ?? "—"}
                </p>
              </div>
            ))}
          </div>

          {/* AI Feedback */}
          {activeSession.aiFeedback && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 mb-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-1">
                AI Feedback
              </h4>
              <p className="text-sm text-blue-800 leading-relaxed">
                {activeSession.aiFeedback}
              </p>
            </div>
          )}

          <Button onClick={handleBack} className="gap-1.5">
            <Users className="h-4 w-4" />
            Try Another Scenario
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
