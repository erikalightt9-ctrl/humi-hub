import { Award, Trophy, ClipboardList, FileCheck, GraduationCap } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PortfolioCertificate {
  readonly certNumber: string;
  readonly courseTitle: string;
  readonly issuedAt: string | Date;
}

interface PortfolioBadge {
  readonly name: string;
  readonly icon: string;
  readonly description: string;
  readonly earnedAt: string | Date;
}

interface PortfolioQuizScore {
  readonly quizTitle: string;
  readonly bestScore: number;
  readonly passed: boolean;
}

interface PortfolioAssignment {
  readonly title: string;
  readonly grade: number | null;
  readonly status: string;
}

interface PortfolioPreviewProps {
  readonly studentName: string;
  readonly courseTitle: string;
  readonly courseSlug: string;
  readonly enrolledAt: string | Date;
  readonly certificates: ReadonlyArray<PortfolioCertificate>;
  readonly badges: ReadonlyArray<PortfolioBadge>;
  readonly quizScores: ReadonlyArray<PortfolioQuizScore>;
  readonly assignments: ReadonlyArray<PortfolioAssignment>;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function slugToLabel(slug: string): string {
  return slug.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function PortfolioPreview({
  studentName,
  courseTitle,
  courseSlug,
  enrolledAt,
  certificates,
  badges,
  quizScores,
  assignments,
}: PortfolioPreviewProps) {
  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold">{studentName.charAt(0)}</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold">{studentName}</h2>
            <p className="text-blue-200 text-sm">{courseTitle}</p>
            <p className="text-blue-300 text-xs mt-1">
              Student since {formatDate(enrolledAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Certificates */}
      {certificates.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Certificates</h3>
          </div>
          <div className="space-y-3">
            {certificates.map((cert) => (
              <div
                key={cert.certNumber}
                className="flex items-center justify-between bg-green-50 rounded-lg px-4 py-3 border border-green-100"
              >
                <div>
                  <p className="font-medium text-gray-900">{cert.courseTitle}</p>
                  <p className="text-xs text-gray-500">
                    Issued {formatDate(cert.issuedAt)} · Cert #{cert.certNumber}
                  </p>
                </div>
                <Award className="h-5 w-5 text-green-600 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badges */}
      {badges.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-5 w-5 text-amber-600" />
            <h3 className="font-semibold text-gray-900">Badges Earned</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {badges.map((badge) => (
              <div
                key={badge.name}
                className="bg-amber-50 rounded-lg p-3 border border-amber-100 text-center"
              >
                <div className="text-2xl mb-1">{badge.icon}</div>
                <p className="font-medium text-gray-900 text-sm">{badge.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{badge.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quiz Performance */}
      {quizScores.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Quiz Performance</h3>
          </div>
          <div className="space-y-2">
            {quizScores.map((quiz) => (
              <div
                key={quiz.quizTitle}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50"
              >
                <span className="text-sm text-gray-700">{quiz.quizTitle}</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-semibold ${
                      quiz.passed ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {quiz.bestScore}%
                  </span>
                  {quiz.passed && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      Passed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assignments */}
      {assignments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileCheck className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Assignments</h3>
          </div>
          <div className="space-y-2">
            {assignments.map((assignment) => (
              <div
                key={assignment.title}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50"
              >
                <span className="text-sm text-gray-700">{assignment.title}</span>
                <div className="flex items-center gap-2">
                  {assignment.grade !== null ? (
                    <span className="text-sm font-semibold text-gray-900">
                      {assignment.grade}/100
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">{assignment.status}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {certificates.length === 0 &&
        badges.length === 0 &&
        quizScores.length === 0 &&
        assignments.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
            <p className="text-gray-500">
              This student is just getting started. Check back later for achievements!
            </p>
          </div>
        )}
    </div>
  );
}
