"use client";

import { useState, useEffect, useCallback } from "react";
import { Target, RefreshCw, Loader2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ScoreRecord {
  readonly id: string;
  readonly communication: number;
  readonly accuracy: number;
  readonly speed: number;
  readonly reliability: number;
  readonly technicalSkills: number;
  readonly professionalism: number;
  readonly overallScore: number;
  readonly aiSummary: string;
  readonly evaluatedAt: string;
}

interface CareerData {
  readonly latest: ScoreRecord | null;
  readonly history: ReadonlyArray<ScoreRecord>;
  readonly canRefresh: boolean;
}

/* ------------------------------------------------------------------ */
/*  Radar Chart (SVG)                                                  */
/* ------------------------------------------------------------------ */

const DIMENSIONS = [
  { key: "communication", label: "Communication" },
  { key: "accuracy", label: "Accuracy" },
  { key: "speed", label: "Speed" },
  { key: "reliability", label: "Reliability" },
  { key: "technicalSkills", label: "Tech Skills" },
  { key: "professionalism", label: "Professionalism" },
] as const;

function RadarChart({ score }: { readonly score: ScoreRecord }) {
  const cx = 150;
  const cy = 150;
  const maxR = 110;
  const levels = [25, 50, 75, 100];

  function polarToCart(angle: number, value: number) {
    const r = (value / 100) * maxR;
    const rad = (angle - 90) * (Math.PI / 180);
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  const angleStep = 360 / DIMENSIONS.length;

  const points = DIMENSIONS.map((dim, i) => {
    const val = score[dim.key] as number;
    return polarToCart(i * angleStep, val);
  });

  const polygon = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg viewBox="0 0 300 300" className="w-full max-w-[280px] mx-auto">
      {/* Grid levels */}
      {levels.map((level) => {
        const gridPoints = DIMENSIONS.map((_, i) =>
          polarToCart(i * angleStep, level),
        );
        const gridPolygon = gridPoints.map((p) => `${p.x},${p.y}`).join(" ");
        return (
          <polygon
            key={level}
            points={gridPolygon}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={1}
          />
        );
      })}

      {/* Axes */}
      {DIMENSIONS.map((_, i) => {
        const end = polarToCart(i * angleStep, 100);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={end.x}
            y2={end.y}
            stroke="#e5e7eb"
            strokeWidth={1}
          />
        );
      })}

      {/* Data polygon */}
      <polygon
        points={polygon}
        fill="rgba(59, 130, 246, 0.2)"
        stroke="#3b82f6"
        strokeWidth={2}
      />

      {/* Data points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill="#3b82f6" />
      ))}

      {/* Labels */}
      {DIMENSIONS.map((dim, i) => {
        const labelPos = polarToCart(i * angleStep, 125);
        return (
          <text
            key={dim.key}
            x={labelPos.x}
            y={labelPos.y}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-gray-600 text-[10px] font-medium"
          >
            {dim.label}
          </text>
        );
      })}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Score Color                                                        */
/* ------------------------------------------------------------------ */

function scoreColor(score: number): string {
  if (score >= 75) return "text-green-600";
  if (score >= 50) return "text-yellow-600";
  return "text-red-500";
}

function scoreBg(score: number): string {
  if (score >= 75) return "bg-green-50 border-green-200";
  if (score >= 50) return "bg-yellow-50 border-yellow-200";
  return "bg-red-50 border-red-200";
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function CareerReadinessCard() {
  const [data, setData] = useState<CareerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/student/career-readiness");
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
  }, [fetchData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);

    try {
      const res = await fetch("/api/student/career-readiness", {
        method: "POST",
      });
      const json = await res.json();

      if (json.success) {
        // Refetch full data to get updated history
        await fetchData();
      } else {
        setError(json.error ?? "Failed to evaluate");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setRefreshing(false);
    }
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-red-50 rounded-xl border border-red-200 p-6 text-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const latest = data?.latest;

  return (
    <div className="space-y-6">
      {/* Score Overview */}
      {latest ? (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 rounded-lg p-2">
                  <Target className="h-5 w-5 text-blue-700" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">
                    Career Readiness Score
                  </h2>
                  <p className="text-xs text-gray-500">
                    AI-evaluated job readiness across 6 dimensions
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleRefresh}
                disabled={refreshing || !data?.canRefresh}
              >
                {refreshing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                {refreshing ? "Evaluating..." : "Refresh Score"}
              </Button>
            </div>

            {error && (
              <p className="text-sm text-red-500 mb-4">{error}</p>
            )}

            {!data?.canRefresh && !refreshing && (
              <p className="text-xs text-gray-400 mb-4">
                Score can be refreshed once every 24 hours
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Radar Chart */}
              <div className="flex flex-col items-center">
                <RadarChart score={latest} />
              </div>

              {/* Overall Score + Dimensions */}
              <div className="space-y-4">
                {/* Big score */}
                <div
                  className={`rounded-xl border p-4 text-center ${scoreBg(latest.overallScore)}`}
                >
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Overall Score
                  </p>
                  <p
                    className={`text-5xl font-bold mt-1 ${scoreColor(latest.overallScore)}`}
                  >
                    {latest.overallScore}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">out of 100</p>
                </div>

                {/* Dimension bars */}
                <div className="space-y-2">
                  {DIMENSIONS.map((dim) => {
                    const val = latest[dim.key] as number;
                    return (
                      <div key={dim.key}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-600">{dim.label}</span>
                          <span className={`font-semibold ${scoreColor(val)}`}>
                            {val}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-500"
                            style={{ width: `${val}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* AI Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-3">AI Summary</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {latest.aiSummary}
            </p>
            <p className="text-xs text-gray-400 mt-3">
              Evaluated{" "}
              {new Date(latest.evaluatedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          {/* Score History */}
          {data && data.history.length > 1 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">Score History</h3>
              </div>
              <div className="space-y-2">
                {data.history.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50"
                  >
                    <span className="text-sm text-gray-600">
                      {new Date(record.evaluatedAt).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric", year: "numeric" },
                      )}
                    </span>
                    <span
                      className={`text-sm font-semibold ${scoreColor(record.overallScore)}`}
                    >
                      {record.overallScore}/100
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        /* No score yet */
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Target className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            No Career Readiness Score Yet
          </h2>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            Get your AI-evaluated career readiness score. Our AI analyzes your
            quiz performance, assignments, attendance, and participation to
            assess your job readiness.
          </p>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Target className="h-4 w-4" />
            )}
            {refreshing ? "Evaluating..." : "Get My Career Score"}
          </Button>
          {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
        </div>
      )}
    </div>
  );
}
