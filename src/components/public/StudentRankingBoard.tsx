"use client";

import { useEffect, useState, useCallback } from "react";
import { Trophy, Medal, Loader2, Users } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface RankedStudent {
  readonly rank: number;
  readonly anonymizedName: string;
  readonly courseTitle: string;
  readonly courseSlug: string;
  readonly compositeScore: number;
}

interface ApiResponse {
  readonly success: boolean;
  readonly data: readonly RankedStudent[] | null;
  readonly error: string | null;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

interface CourseTab {
  readonly slug: string;
  readonly label: string;
}

const COURSE_TABS: readonly CourseTab[] = [
  { slug: "", label: "All" },
  { slug: "medical-va", label: "Medical VA" },
  { slug: "real-estate-va", label: "Real Estate VA" },
  { slug: "us-bookkeeping-va", label: "Bookkeeping VA" },
] as const;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getMedalColor(rank: number): string {
  switch (rank) {
    case 1:
      return "text-yellow-500";
    case 2:
      return "text-gray-400";
    case 3:
      return "text-amber-600";
    default:
      return "text-gray-300";
  }
}

function getScoreBarWidth(score: number): string {
  return `${Math.min(Math.max(score, 0), 100)}%`;
}

function getScoreBarColor(score: number): string {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-blue-500";
  if (score >= 40) return "bg-yellow-500";
  return "bg-red-400";
}

function getCourseBadgeColor(slug: string): string {
  switch (slug) {
    case "MEDICAL_VA":
      return "bg-rose-50 text-rose-700";
    case "REAL_ESTATE_VA":
      return "bg-amber-50 text-amber-700";
    case "US_BOOKKEEPING_VA":
      return "bg-emerald-50 text-emerald-700";
    default:
      return "bg-blue-50 text-blue-700";
  }
}

function getRankBgColor(rank: number): string {
  switch (rank) {
    case 1:
      return "bg-yellow-50 border-yellow-200";
    case 2:
      return "bg-gray-50 border-gray-200";
    case 3:
      return "bg-amber-50 border-amber-200";
    default:
      return "bg-white border-gray-100";
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function StudentRankingBoard() {
  const [students, setStudents] = useState<readonly RankedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("");

  const fetchRanking = useCallback(async (courseSlug: string) => {
    setLoading(true);
    setError(null);

    try {
      const qs = courseSlug ? `?courseSlug=${courseSlug}` : "";
      const res = await fetch(`/api/public/student-ranking${qs}`);
      const json: ApiResponse = await res.json();

      if (!json.success) {
        setError(json.error ?? "Failed to load ranking");
        setStudents([]);
        return;
      }

      setStudents(json.data ?? []);
    } catch {
      setError("Unable to load ranking. Please try again.");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRanking(activeTab);
  }, [activeTab, fetchRanking]);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-700/50 px-4 py-1.5 rounded-full text-sm text-blue-100 mb-6">
            <Trophy className="h-4 w-4" />
            <span>Leaderboard</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Top Performing Students
          </h1>
          <p className="text-blue-100 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
            Our leaderboard showcases the highest-performing students across all
            programs, ranked by a composite score that reflects their overall
            mastery.
          </p>
        </div>
      </section>

      {/* Ranking Section */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          {/* Course Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {COURSE_TABS.map((tab) => (
              <button
                key={tab.slug}
                type="button"
                onClick={() => setActiveTab(tab.slug)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeTab === tab.slug
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white text-gray-600 hover:bg-blue-50 border border-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
              <span className="text-gray-500">Loading ranking...</span>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="text-center py-20">
              <p className="text-red-600 font-medium">{error}</p>
              <button
                type="button"
                onClick={() => fetchRanking(activeTab)}
                className="mt-4 text-sm text-blue-600 hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && students.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Users className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium text-gray-500">
                No ranked students yet
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Check back soon as students complete their coursework.
              </p>
            </div>
          )}

          {/* Ranked List */}
          {!loading && !error && students.length > 0 && (
            <div className="space-y-3">
              {students.map((student) => (
                <div
                  key={`${student.rank}-${student.anonymizedName}`}
                  className={`flex items-center gap-4 p-4 rounded-xl border shadow-sm transition-shadow hover:shadow-md ${getRankBgColor(student.rank)}`}
                >
                  {/* Rank Number / Medal */}
                  <div className="shrink-0 w-12 text-center">
                    {student.rank <= 3 ? (
                      <Medal
                        className={`h-7 w-7 mx-auto ${getMedalColor(student.rank)}`}
                      />
                    ) : (
                      <span className="text-xl font-bold text-gray-400">
                        {student.rank}
                      </span>
                    )}
                  </div>

                  {/* Name & Course */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {student.anonymizedName}
                    </p>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getCourseBadgeColor(student.courseSlug)}`}
                    >
                      {student.courseTitle}
                    </span>
                  </div>

                  {/* Score Bar & Number */}
                  <div className="shrink-0 w-40">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400">Score</span>
                      <span className="text-sm font-bold text-gray-800">
                        {student.compositeScore}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${getScoreBarColor(student.compositeScore)}`}
                        style={{ width: getScoreBarWidth(student.compositeScore) }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
