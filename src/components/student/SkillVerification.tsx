"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  Loader2,
  ShieldCheck,
  Star,
  Copy,
  Check,
  MessageSquare,
  Monitor,
  Clock,
  Lightbulb,
  Award,
  Target,
  Wrench,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface VerifiedSkill {
  readonly id: string;
  readonly studentId: string;
  readonly skillType: string;
  readonly level: number;
  readonly evidence: string;
  readonly verifiedAt: string;
}

interface SkillVerificationData {
  readonly skills: ReadonlyArray<VerifiedSkill>;
  readonly canRefresh: boolean;
  readonly hoursUntilRefresh: number;
}

interface SkillVerificationProps {
  readonly studentId: string;
}

/* ------------------------------------------------------------------ */
/*  Skill metadata                                                     */
/* ------------------------------------------------------------------ */

const SKILL_META: Record<
  string,
  {
    readonly label: string;
    readonly icon: React.ComponentType<{ className?: string }>;
    readonly color: string;
    readonly bgColor: string;
  }
> = {
  COMMUNICATION: {
    label: "Communication",
    icon: MessageSquare,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  TECHNICAL: {
    label: "Technical",
    icon: Monitor,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  TIME_MANAGEMENT: {
    label: "Time Management",
    icon: Clock,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  PROBLEM_SOLVING: {
    label: "Problem Solving",
    icon: Lightbulb,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  PROFESSIONALISM: {
    label: "Professionalism",
    icon: Award,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
  },
  ACCURACY: {
    label: "Accuracy",
    icon: Target,
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  TOOL_PROFICIENCY: {
    label: "Tool Proficiency",
    icon: Wrench,
    color: "text-teal-600",
    bgColor: "bg-teal-50",
  },
  CLIENT_MANAGEMENT: {
    label: "Client Management",
    icon: Users,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
  },
};

/* ------------------------------------------------------------------ */
/*  Star Rating                                                        */
/* ------------------------------------------------------------------ */

function StarRating({ level }: { readonly level: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < level
              ? "fill-yellow-400 text-yellow-400"
              : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton Loading Card                                              */
/* ------------------------------------------------------------------ */

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gray-200 rounded-lg" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="h-3 bg-gray-200 rounded w-1/3" />
        </div>
      </div>
      <div className="flex gap-1 mb-3">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="w-4 h-4 bg-gray-200 rounded" />
        ))}
      </div>
      <div className="h-3 bg-gray-200 rounded w-full mb-2" />
      <div className="h-3 bg-gray-200 rounded w-3/4" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Skill Card                                                         */
/* ------------------------------------------------------------------ */

function SkillCard({ skill }: { readonly skill: VerifiedSkill }) {
  const meta = SKILL_META[skill.skillType] ?? {
    label: skill.skillType,
    icon: ShieldCheck,
    color: "text-gray-600",
    bgColor: "bg-gray-50",
  };
  const Icon = meta.icon;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`${meta.bgColor} rounded-lg p-2.5`}>
          <Icon className={`h-5 w-5 ${meta.color}`} />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">
            {meta.label}
          </h3>
          <p className="text-xs text-gray-500">Level {skill.level}/5</p>
        </div>
      </div>

      {/* Star Rating */}
      <div className="mb-3">
        <StarRating level={skill.level} />
      </div>

      {/* Evidence */}
      <p className="text-xs text-gray-500 leading-relaxed mb-2">
        {skill.evidence}
      </p>

      {/* Verified Date */}
      <p className="text-[11px] text-gray-400">
        Verified{" "}
        {new Date(skill.verifiedAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function SkillVerification({ studentId }: SkillVerificationProps) {
  const [data, setData] = useState<SkillVerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/student/skill-verification");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error ?? "Failed to load skills");
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
      const res = await fetch("/api/student/skill-verification", {
        method: "POST",
      });
      const json = await res.json();

      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error ?? "Failed to refresh skills");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleCopyLink = useCallback(async () => {
    const url = `${window.location.origin}/verify-skills/${studentId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [studentId]);

  /* Loading state */
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 8 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  /* Error state (no data at all) */
  if (error && !data) {
    return (
      <div className="bg-red-50 rounded-xl border border-red-200 p-6 text-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const skills = data?.skills ?? [];
  const hasSkills = skills.length > 0;

  return (
    <div className="space-y-6">
      {/* Refresh Button + Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">
            {hasSkills
              ? `${skills.length} skills verified`
              : "No skills verified yet"}
          </span>
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
          {refreshing
            ? "Verifying..."
            : data?.canRefresh
              ? "Refresh Skills"
              : `Available in ${data?.hoursUntilRefresh ?? 24}h`}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {!data?.canRefresh && !refreshing && hasSkills && (
        <p className="text-xs text-gray-400">
          Skills can be refreshed once every 24 hours
        </p>
      )}

      {/* Skills Grid */}
      {hasSkills ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {skills.map((skill) => (
            <SkillCard key={skill.id} skill={skill} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            No Verified Skills Yet
          </h2>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            Click &quot;Refresh Skills&quot; to auto-verify your skills based on
            your performance across quizzes, assignments, simulations,
            interviews, and more.
          </p>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            {refreshing ? "Verifying..." : "Verify My Skills"}
          </Button>
          {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
        </div>
      )}

      {/* Share Link Section */}
      {hasSkills && (
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-4 w-4 text-blue-700" />
            <h3 className="text-sm font-semibold text-blue-900">
              Share Your Verified Skills
            </h3>
          </div>
          <p className="text-xs text-blue-700 mb-3">
            Share this link with employers to showcase your verified skill
            levels. Make sure your portfolio is set to public in your settings.
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white rounded-lg border border-blue-200 px-3 py-2 text-sm text-gray-600 truncate">
              {typeof window !== "undefined"
                ? `${window.location.origin}/verify-skills/${studentId}`
                : `/verify-skills/${studentId}`}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 shrink-0"
              onClick={handleCopyLink}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
