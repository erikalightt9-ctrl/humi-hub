"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart2,
  FileText,
  Monitor,
  Users,
  Mail,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FeatureSummary {
  readonly featureName: string;
  readonly featureSlug: string;
  readonly latestScore: number | null;
  readonly averageScore: number | null;
  readonly sessionCount: number;
  readonly lastActivityAt: string | null;
  readonly trend: "improving" | "declining" | "stable" | "insufficient_data";
}

interface RecentScore {
  readonly date: string;
  readonly score: number;
  readonly feature: string;
}

interface AggregatedFeedback {
  readonly overallAverageScore: number | null;
  readonly totalAISessions: number;
  readonly features: ReadonlyArray<FeatureSummary>;
  readonly recentScores: ReadonlyArray<RecentScore>;
}

interface StrengthArea {
  readonly area: string;
  readonly evidence: string;
  readonly score: number;
}

interface ImprovementArea {
  readonly area: string;
  readonly suggestion: string;
  readonly priority: "high" | "medium" | "low";
}

interface FullAssessment {
  readonly overallScore: number;
  readonly summary: string;
  readonly strengthAreas: ReadonlyArray<StrengthArea>;
  readonly improvementAreas: ReadonlyArray<ImprovementArea>;
  readonly learningRecommendation: string;
  readonly nextSteps: ReadonlyArray<string>;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const RATE_LIMIT_KEY = "ai-feedback-engine-last-assessment";
const RATE_LIMIT_HOURS = 24;

const FEATURE_CONFIG: Record<
  string,
  {
    readonly icon: typeof BarChart2;
    readonly color: string;
    readonly bgColor: string;
    readonly borderColor: string;
    readonly barColor: string;
    readonly href: string;
  }
> = {
  Assignments: {
    icon: FileText,
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    barColor: "bg-orange-500",
    href: "/student/ai-assessments",
  },
  "VA Simulations": {
    icon: Monitor,
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    barColor: "bg-blue-500",
    href: "/student/ai-simulator",
  },
  "Mock Interviews": {
    icon: Users,
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    barColor: "bg-purple-500",
    href: "/student/ai-interviews",
  },
  "Email Practice": {
    icon: Mail,
    color: "text-teal-700",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-200",
    barColor: "bg-teal-500",
    href: "/student/ai-email-practice",
  },
  "Career Readiness": {
    icon: Target,
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    barColor: "bg-green-500",
    href: "/student/career-readiness",
  },
};

const DEFAULT_FEATURE_CONFIG = {
  icon: BarChart2,
  color: "text-gray-700",
  bgColor: "bg-gray-50",
  borderColor: "border-gray-200",
  barColor: "bg-gray-500",
  href: "#",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function scoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  return "text-red-500";
}

function scoreBg(score: number): string {
  if (score >= 80) return "bg-green-50 border-green-200";
  if (score >= 60) return "bg-yellow-50 border-yellow-200";
  return "bg-red-50 border-red-200";
}

function scoreRingColor(score: number): string {
  if (score >= 80) return "stroke-green-500";
  if (score >= 60) return "stroke-yellow-500";
  return "stroke-red-500";
}

function getFeatureConfig(featureName: string) {
  return FEATURE_CONFIG[featureName] ?? DEFAULT_FEATURE_CONFIG;
}

function isRateLimited(): boolean {
  if (typeof window === "undefined") return false;
  const lastUsed = localStorage.getItem(RATE_LIMIT_KEY);
  if (!lastUsed) return false;
  const elapsed = Date.now() - parseInt(lastUsed, 10);
  return elapsed < RATE_LIMIT_HOURS * 60 * 60 * 1000;
}

function setRateLimitTimestamp(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(RATE_LIMIT_KEY, Date.now().toString());
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/* ------------------------------------------------------------------ */
/*  Score Ring                                                         */
/* ------------------------------------------------------------------ */

function ScoreRing({
  score,
  size = 120,
}: {
  readonly score: number;
  readonly size?: number;
}) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={scoreRingColor(score)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold ${scoreColor(score)}`}>
          {score}
        </span>
        <span className="text-xs text-gray-500">/ 100</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Trend Icon                                                         */
/* ------------------------------------------------------------------ */

function TrendIndicator({
  trend,
}: {
  readonly trend: FeatureSummary["trend"];
}) {
  switch (trend) {
    case "improving":
      return (
        <span className="flex items-center gap-1 text-xs text-green-600">
          <TrendingUp className="h-3.5 w-3.5" /> Improving
        </span>
      );
    case "declining":
      return (
        <span className="flex items-center gap-1 text-xs text-red-500">
          <TrendingDown className="h-3.5 w-3.5" /> Declining
        </span>
      );
    case "stable":
      return (
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <Minus className="h-3.5 w-3.5" /> Stable
        </span>
      );
    default:
      return (
        <span className="text-xs text-gray-400">Not enough data</span>
      );
  }
}

/* ------------------------------------------------------------------ */
/*  Feature Card                                                       */
/* ------------------------------------------------------------------ */

function FeatureCard({ feature }: { readonly feature: FeatureSummary }) {
  const config = getFeatureConfig(feature.featureName);
  const Icon = config.icon;
  const hasData = feature.sessionCount > 0;

  return (
    <a
      href={config.href}
      className={`block rounded-xl border p-5 transition-shadow hover:shadow-md ${config.borderColor} ${config.bgColor}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`rounded-lg p-1.5 bg-white/70`}>
            <Icon className={`h-4 w-4 ${config.color}`} />
          </div>
          <h3 className="font-semibold text-sm text-gray-900">
            {feature.featureName}
          </h3>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-400" />
      </div>

      {hasData ? (
        <>
          <div className="flex items-end gap-3 mb-3">
            <span
              className={`text-3xl font-bold ${scoreColor(feature.latestScore!)}`}
            >
              {feature.latestScore}
            </span>
            <span className="text-sm text-gray-500 mb-1">
              avg {feature.averageScore}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {feature.sessionCount} session{feature.sessionCount !== 1 ? "s" : ""}
            </span>
            <TrendIndicator trend={feature.trend} />
          </div>
        </>
      ) : (
        <div className="py-2">
          <p className="text-sm text-gray-500">No sessions yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Click to get started
          </p>
        </div>
      )}
    </a>
  );
}

/* ------------------------------------------------------------------ */
/*  Score Timeline (CSS bar chart)                                     */
/* ------------------------------------------------------------------ */

function ScoreTimeline({
  scores,
}: {
  readonly scores: ReadonlyArray<RecentScore>;
}) {
  if (scores.length === 0) return null;

  // Display chronologically (oldest first)
  const chronological = [...scores].reverse();

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-4">
        Recent Score Timeline
      </h3>

      <div className="flex items-end gap-1.5 h-40">
        {chronological.map((entry, i) => {
          const config = getFeatureConfig(entry.feature);
          return (
            <div
              key={`${entry.date}-${i}`}
              className="flex-1 flex flex-col items-center gap-1 group relative"
            >
              {/* Tooltip */}
              <div className="hidden group-hover:block absolute -top-16 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-10 shadow-lg">
                <p className="font-semibold">{entry.score}/100</p>
                <p className="text-gray-300">{entry.feature}</p>
                <p className="text-gray-400">{formatDate(entry.date)}</p>
              </div>

              {/* Bar */}
              <div
                className={`w-full rounded-t ${config.barColor} transition-all duration-300 min-h-[4px]`}
                style={{ height: `${Math.max(entry.score, 4)}%` }}
              />

              {/* Date label (show every 4th) */}
              {i % 4 === 0 && (
                <span className="text-[9px] text-gray-400 -rotate-45 origin-top-left mt-1">
                  {formatDate(entry.date)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-gray-100">
        {Object.entries(FEATURE_CONFIG).map(([name, cfg]) => (
          <div key={name} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-sm ${cfg.barColor}`} />
            <span className="text-xs text-gray-500">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Assessment Panel                                                   */
/* ------------------------------------------------------------------ */

function AssessmentPanel({
  assessment,
}: {
  readonly assessment: FullAssessment;
}) {
  return (
    <div className="space-y-4">
      {/* Overall score + Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start gap-6">
          <ScoreRing score={assessment.overallScore} size={100} />
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-2">
              AI Assessment Summary
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              {assessment.summary}
            </p>
          </div>
        </div>
      </div>

      {/* Strengths */}
      {assessment.strengthAreas.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">
            Strength Areas
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {assessment.strengthAreas.map((strength, i) => (
              <div
                key={i}
                className="bg-green-50 border border-green-200 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-green-800 text-sm">
                    {strength.area}
                  </h5>
                  <span className="text-xs font-semibold text-green-700 bg-green-100 rounded-full px-2 py-0.5">
                    {strength.score}/100
                  </span>
                </div>
                <p className="text-xs text-green-700 leading-relaxed">
                  {strength.evidence}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Improvements */}
      {assessment.improvementAreas.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">
            Areas for Improvement
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {assessment.improvementAreas.map((area, i) => {
              const priorityStyles: Record<string, string> = {
                high: "bg-red-100 text-red-700",
                medium: "bg-yellow-100 text-yellow-700",
                low: "bg-green-100 text-green-700",
              };

              return (
                <div
                  key={i}
                  className="bg-orange-50 border border-orange-200 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-orange-800 text-sm">
                      {area.area}
                    </h5>
                    <span
                      className={`text-[10px] font-bold uppercase rounded-full px-2 py-0.5 ${priorityStyles[area.priority] ?? priorityStyles.medium}`}
                    >
                      {area.priority}
                    </span>
                  </div>
                  <p className="text-xs text-orange-700 leading-relaxed">
                    {area.suggestion}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Learning Recommendation */}
      {assessment.learningRecommendation && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
          <h4 className="font-semibold text-indigo-900 mb-2">
            Personalized Learning Path
          </h4>
          <p className="text-sm text-indigo-800 leading-relaxed">
            {assessment.learningRecommendation}
          </p>
        </div>
      )}

      {/* Next Steps */}
      {assessment.nextSteps.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h4 className="font-semibold text-gray-900 mb-3">
            Recommended Next Steps
          </h4>
          <ol className="space-y-2">
            {assessment.nextSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span className="text-sm text-gray-700">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function AIFeedbackDashboard() {
  const [data, setData] = useState<AggregatedFeedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [assessment, setAssessment] = useState<FullAssessment | null>(null);
  const [assessmentLoading, setAssessmentLoading] = useState(false);
  const [assessmentError, setAssessmentError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);

  /* ----- Fetch dashboard data ----- */
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/student/ai-feedback-engine");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error ?? "Failed to load data");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    setRateLimited(isRateLimited());
  }, [fetchData]);

  /* ----- Request full assessment ----- */
  const handleRequestAssessment = useCallback(async () => {
    setAssessmentLoading(true);
    setAssessmentError(null);

    try {
      const res = await fetch("/api/student/ai-feedback-engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "full-assessment" }),
      });
      const json = await res.json();

      if (json.success) {
        setAssessment(json.data);
        setRateLimitTimestamp();
        setRateLimited(true);
      } else {
        setAssessmentError(json.error ?? "Failed to generate assessment");
      }
    } catch {
      setAssessmentError("Network error. Please try again.");
    } finally {
      setAssessmentLoading(false);
    }
  }, []);

  /* ----- Loading state ----- */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  /* ----- Error state ----- */
  if (error && !data) {
    return (
      <div className="bg-red-50 rounded-xl border border-red-200 p-6 text-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  /* ----- Empty state ----- */
  if (!data || data.totalAISessions === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
        <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <BarChart2 className="h-8 w-8 text-indigo-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          No AI Feedback Data Yet
        </h2>
        <p className="text-sm text-gray-500 mb-6 max-w-lg mx-auto">
          Start using AI features to see your performance dashboard. Try a
          VA Simulation or Mock Interview to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ----- Section 1: Overall Score ----- */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {data.overallAverageScore !== null ? (
            <ScoreRing score={data.overallAverageScore} />
          ) : (
            <div className="w-[120px] h-[120px] rounded-full border-4 border-gray-200 flex items-center justify-center">
              <span className="text-gray-400 text-sm">N/A</span>
            </div>
          )}
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-bold text-gray-900">
              Overall Performance
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Weighted average across all AI-evaluated features
            </p>
            <div className="mt-3 inline-flex items-center gap-2 bg-indigo-50 rounded-lg px-3 py-1.5">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-medium text-indigo-700">
                {data.totalAISessions} total AI session{data.totalAISessions !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ----- Section 2: Feature Breakdown ----- */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">
          Feature Breakdown
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.features.map((feature) => (
            <FeatureCard key={feature.featureSlug} feature={feature} />
          ))}
        </div>
      </div>

      {/* ----- Section 3: Score Timeline ----- */}
      <ScoreTimeline scores={data.recentScores} />

      {/* ----- Section 4: Full AI Assessment ----- */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            <h3 className="font-semibold text-gray-900">
              Full AI Assessment
            </h3>
          </div>

          {!assessment && !assessmentLoading && (
            <Button
              onClick={handleRequestAssessment}
              disabled={rateLimited}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {rateLimited
                ? "Assessment Available in 24h"
                : "Request Full AI Assessment"}
            </Button>
          )}
        </div>

        {assessmentError && (
          <p className="text-sm text-red-500 mb-4">{assessmentError}</p>
        )}

        {assessmentLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-4" />
            <p className="text-sm text-gray-600 font-medium">
              AI is analyzing your complete training data...
            </p>
            <p className="text-xs text-gray-400 mt-1">
              This may take a few seconds
            </p>
          </div>
        )}

        {!assessment && !assessmentLoading && (
          <p className="text-sm text-gray-500">
            Get a comprehensive AI-powered analysis of your performance
            across all training modules. The assessment includes strengths,
            areas for improvement, and a personalized learning path.
          </p>
        )}

        {assessment && <AssessmentPanel assessment={assessment} />}
      </div>
    </div>
  );
}
