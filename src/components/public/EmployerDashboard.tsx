"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  UserCircle,
  Award,
  ShieldCheck,
  Loader2,
  Briefcase,
  Users,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CareerScore {
  readonly overallScore: number;
  readonly communication: number;
  readonly accuracy: number;
  readonly speed: number;
  readonly reliability: number;
  readonly technicalSkills: number;
  readonly professionalism: number;
}

interface Graduate {
  readonly id: string;
  readonly name: string;
  readonly bio: string | null;
  readonly avatarUrl: string | null;
  readonly courseSlug: string;
  readonly courseTitle: string;
  readonly latestScore: CareerScore;
  readonly certificateCount: number;
  readonly badgeCount: number;
}

interface ApiResponse {
  readonly success: boolean;
  readonly data: readonly Graduate[] | null;
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

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-blue-600";
  if (score >= 40) return "text-yellow-600";
  return "text-red-500";
}

function getScoreRingColor(score: number): string {
  if (score >= 80) return "stroke-green-500";
  if (score >= 60) return "stroke-blue-500";
  if (score >= 40) return "stroke-yellow-500";
  return "stroke-red-400";
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

/* ------------------------------------------------------------------ */
/*  Circular Score Component                                           */
/* ------------------------------------------------------------------ */

function CircularScore({ score }: { readonly score: number }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-24 h-24 mx-auto">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="6"
        />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          className={getScoreRingColor(score)}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
          {score}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function EmployerDashboard() {
  const [graduates, setGraduates] = useState<readonly Graduate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("");

  const fetchGraduates = useCallback(async (courseSlug: string) => {
    setLoading(true);
    setError(null);

    try {
      const qs = courseSlug ? `?courseSlug=${courseSlug}` : "";
      const res = await fetch(`/api/public/employer-dashboard${qs}`);
      const json: ApiResponse = await res.json();

      if (!json.success) {
        setError(json.error ?? "Failed to load graduates");
        setGraduates([]);
        return;
      }

      setGraduates(json.data ?? []);
    } catch {
      setError("Unable to load graduates. Please try again.");
      setGraduates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGraduates(activeTab);
  }, [activeTab, fetchGraduates]);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-700/50 px-4 py-1.5 rounded-full text-sm text-blue-100 mb-6">
            <Users className="h-4 w-4" />
            <span>Verified VA Talent Pool</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Hire Our Trained Virtual Assistants
          </h1>
          <p className="text-blue-100 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
            Browse AI-assessed, career-ready graduates with verified skills,
            certifications, and real performance data. Find your next VA in
            minutes.
          </p>
        </div>
      </section>

      {/* Filter Tabs + Grid */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
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
              <span className="text-gray-500">Loading graduates...</span>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="text-center py-20">
              <p className="text-red-600 font-medium">{error}</p>
              <button
                type="button"
                onClick={() => fetchGraduates(activeTab)}
                className="mt-4 text-sm text-blue-600 hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && graduates.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Briefcase className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium text-gray-500">
                No graduates found
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Try selecting a different course filter.
              </p>
            </div>
          )}

          {/* Results Count */}
          {!loading && !error && graduates.length > 0 && (
            <p className="text-sm text-gray-500 mb-6">
              Showing {graduates.length}{" "}
              {graduates.length === 1 ? "graduate" : "graduates"}
            </p>
          )}

          {/* Graduate Cards Grid */}
          {!loading && !error && graduates.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {graduates.map((grad) => (
                <div
                  key={grad.id}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  {/* Avatar & Name */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="shrink-0">
                      {grad.avatarUrl ? (
                        <img
                          src={grad.avatarUrl}
                          alt={grad.name}
                          className="w-14 h-14 rounded-full object-cover border-2 border-blue-100"
                        />
                      ) : (
                        <UserCircle className="w-14 h-14 text-gray-300" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {grad.name}
                      </h3>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${getCourseBadgeColor(grad.courseSlug)}`}
                      >
                        {grad.courseTitle}
                      </span>
                    </div>
                  </div>

                  {/* Bio */}
                  {grad.bio && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                      {grad.bio}
                    </p>
                  )}

                  {/* Overall Score */}
                  <div className="mb-4">
                    <p className="text-xs text-gray-400 text-center mb-1 uppercase tracking-wide">
                      Readiness Score
                    </p>
                    <CircularScore score={grad.latestScore.overallScore} />
                  </div>

                  {/* Certificates & Badges */}
                  <div className="flex items-center justify-center gap-6 mb-5">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Award className="h-4 w-4 text-blue-500" />
                      <span>
                        {grad.certificateCount}{" "}
                        {grad.certificateCount === 1 ? "cert" : "certs"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <ShieldCheck className="h-4 w-4 text-green-500" />
                      <span>
                        {grad.badgeCount}{" "}
                        {grad.badgeCount === 1 ? "badge" : "badges"}
                      </span>
                    </div>
                  </div>

                  {/* View Portfolio */}
                  <Link
                    href={`/portfolio/${grad.id}`}
                    className="block w-full text-center px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Portfolio
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-700 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold mb-4">
            Need a Skilled Virtual Assistant?
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            Our graduates are trained, assessed, and ready to contribute from
            day one. Contact us to discuss your hiring needs.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center px-8 py-3 bg-white text-blue-700 font-bold rounded-lg hover:bg-blue-50 transition-colors"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </div>
  );
}
