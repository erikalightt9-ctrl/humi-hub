"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Star,
  Loader2,
  MessageSquare,
  Monitor,
  Clock,
  Lightbulb,
  Award,
  Target,
  Wrench,
  Users,
  AlertCircle,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface VerifiedSkill {
  readonly id: string;
  readonly skillType: string;
  readonly level: number;
  readonly evidence: string;
  readonly verifiedAt: string;
}

interface PublicSkillData {
  readonly studentName: string;
  readonly courseTitle: string;
  readonly skills: ReadonlyArray<VerifiedSkill>;
}

interface SkillVerificationBadgeProps {
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
  }
> = {
  COMMUNICATION: { label: "Communication", icon: MessageSquare },
  TECHNICAL: { label: "Technical", icon: Monitor },
  TIME_MANAGEMENT: { label: "Time Management", icon: Clock },
  PROBLEM_SOLVING: { label: "Problem Solving", icon: Lightbulb },
  PROFESSIONALISM: { label: "Professionalism", icon: Award },
  ACCURACY: { label: "Accuracy", icon: Target },
  TOOL_PROFICIENCY: { label: "Tool Proficiency", icon: Wrench },
  CLIENT_MANAGEMENT: { label: "Client Management", icon: Users },
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
              : "fill-gray-300 text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Badge Card                                                         */
/* ------------------------------------------------------------------ */

function SkillBadge({ skill }: { readonly skill: VerifiedSkill }) {
  const meta = SKILL_META[skill.skillType] ?? {
    label: skill.skillType,
    icon: ShieldCheck,
  };
  const Icon = meta.icon;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-blue-100 p-4 text-center hover:shadow-md transition-shadow">
      <div className="flex justify-center mb-2">
        <div className="bg-blue-50 rounded-full p-2.5">
          <Icon className="h-5 w-5 text-blue-600" />
        </div>
      </div>
      <h3 className="font-semibold text-gray-900 text-sm mb-1.5">
        {meta.label}
      </h3>
      <div className="flex justify-center mb-1.5">
        <StarRating level={skill.level} />
      </div>
      <p className="text-xs text-gray-500 mb-1">Level {skill.level}/5</p>
      <p className="text-[11px] text-gray-400">
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

export function SkillVerificationBadge({
  studentId,
}: SkillVerificationBadgeProps) {
  const [data, setData] = useState<PublicSkillData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/public/verify-skills/${encodeURIComponent(studentId)}`,
      );
      const json = await res.json();

      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error ?? "Failed to load verified skills");
      }
    } catch {
      setError("Network error. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* Loading */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  /* Error / Not Found */
  if (error || !data) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-200 p-8 text-center">
        <div className="bg-gray-100 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-7 w-7 text-gray-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Skills Not Available
        </h2>
        <p className="text-sm text-gray-500">
          {error ??
            "This student's verified skills are not publicly available."}
        </p>
      </div>
    );
  }

  const hasSkills = data.skills.length > 0;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Certificate Card */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-8 pb-6 text-center">
          <div className="flex justify-center mb-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">
            Verified Skills Certificate
          </h1>
          <div className="h-px bg-white/20 max-w-xs mx-auto my-4" />
          <p className="text-lg font-semibold text-blue-100">
            {data.studentName}
          </p>
          <p className="text-sm text-blue-200 mt-1">{data.courseTitle}</p>
        </div>

        {/* Skills Grid */}
        <div className="bg-white/10 backdrop-blur-sm px-6 py-6">
          {hasSkills ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {data.skills.map((skill) => (
                <SkillBadge key={skill.id} skill={skill} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-blue-100 text-sm">
                No verified skills available yet.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 text-center border-t border-white/10">
          <div className="flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-200" />
            <p className="text-xs text-blue-200">
              Verified by HUMI Training Center AI System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
