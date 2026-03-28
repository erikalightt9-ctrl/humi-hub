"use client";

import { useState } from "react";
import {
  FileText,
  ClipboardCheck,
  HelpCircle,
  Clock,
  CheckCircle2,
  XCircle,
  CalendarClock,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CourseTier } from "@prisma/client";
import {
  COURSE_TIER_LABELS,
  COURSE_TIER_COLORS,
  COURSE_TIERS_ORDERED,
} from "@/lib/constants/course-tiers";
import { TrainerAttendanceTable } from "@/components/trainer/TrainerAttendanceTable";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LessonItem {
  readonly id: string;
  readonly title: string;
  readonly order: number;
  readonly durationMin: number;
  readonly isPublished: boolean;
  readonly tier: CourseTier;
}

interface AssignmentItem {
  readonly id: string;
  readonly title: string;
  readonly instructions: string;
  readonly dueDate: string | null;
  readonly maxPoints: number;
  readonly isPublished: boolean;
  readonly createdAt: string;
  readonly totalSubmissions: number;
  readonly pendingCount: number;
}

interface QuizItem {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly passingScore: number;
  readonly isPublished: boolean;
  readonly createdAt: string;
  readonly questionCount: number;
  readonly attemptCount: number;
}

interface CourseDetailTabsProps {
  readonly courseId: string;
  readonly lessons: ReadonlyArray<LessonItem>;
  readonly assignments: ReadonlyArray<AssignmentItem>;
  readonly quizzes: ReadonlyArray<QuizItem>;
}

type TabKey = "lessons" | "assignments" | "quizzes" | "attendance";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(date: string | null): string {
  if (!date) return "No due date";
  return new Date(date).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function PublishedBadge({ published }: { readonly published: boolean }) {
  return published ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-900/40 text-emerald-400 border border-emerald-800">
      <CheckCircle2 className="h-3 w-3" />
      Published
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-ds-surface text-ds-muted border border-ds-border">
      <XCircle className="h-3 w-3" />
      Draft
    </span>
  );
}

function TierBadge({ tier }: { readonly tier: CourseTier }) {
  const colors = COURSE_TIER_COLORS[tier];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
      {COURSE_TIER_LABELS[tier]}
    </span>
  );
}

/** Group lessons by tier, preserving order */
function groupLessonsByTier(
  lessons: ReadonlyArray<LessonItem>,
): ReadonlyArray<{ readonly tier: CourseTier; readonly lessons: ReadonlyArray<LessonItem> }> {
  const groups: Record<CourseTier, LessonItem[]> = {
    BASIC: [],
    PROFESSIONAL: [],
    ADVANCED: [],
  };

  for (const lesson of lessons) {
    groups[lesson.tier].push(lesson);
  }

  return COURSE_TIERS_ORDERED
    .filter((tier) => groups[tier].length > 0)
    .map((tier) => ({ tier, lessons: groups[tier] }));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CourseDetailTabs({
  courseId,
  lessons,
  assignments,
  quizzes,
}: CourseDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("lessons");

  const tabs: ReadonlyArray<{
    readonly key: TabKey;
    readonly label: string;
    readonly icon: React.ComponentType<{ className?: string }>;
    readonly count: number | null;
  }> = [
    { key: "lessons", label: "Lessons", icon: FileText, count: lessons.length },
    {
      key: "assignments",
      label: "Assignments",
      icon: ClipboardCheck,
      count: assignments.length,
    },
    {
      key: "quizzes",
      label: "Quizzes",
      icon: HelpCircle,
      count: quizzes.length,
    },
    {
      key: "attendance",
      label: "Attendance",
      icon: UserCheck,
      count: null,
    },
  ];

  return (
    <div className="bg-ds-card rounded-xl border border-ds-border">
      {/* Tab headers */}
      <div className="flex border-b border-ds-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === tab.key
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-ds-muted hover:text-ds-text hover:border-ds-border",
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {tab.count !== null && (
              <span
                className={cn(
                  "ml-1 px-1.5 py-0.5 rounded-full text-xs",
                  activeTab === tab.key
                    ? "bg-blue-900/40 text-blue-400"
                    : "bg-ds-surface text-ds-muted",
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-5">
        {activeTab === "lessons" && <LessonsTab lessons={lessons} />}
        {activeTab === "assignments" && (
          <AssignmentsTab assignments={assignments} />
        )}
        {activeTab === "quizzes" && <QuizzesTab quizzes={quizzes} />}
        {activeTab === "attendance" && (
          <TrainerAttendanceTable courseId={courseId} />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function LessonsTab({
  lessons,
}: {
  readonly lessons: ReadonlyArray<LessonItem>;
}) {
  const [tierFilter, setTierFilter] = useState<CourseTier | "ALL">("ALL");

  if (lessons.length === 0) {
    return (
      <p className="text-sm text-ds-muted text-center py-8">
        No lessons have been added to this course yet.
      </p>
    );
  }

  const tierGroups = groupLessonsByTier(lessons);
  const hasTiers = tierGroups.length > 1;

  const filteredGroups = tierFilter === "ALL"
    ? tierGroups
    : tierGroups.filter((g) => g.tier === tierFilter);

  return (
    <div className="space-y-4">
      {/* Tier filter tabs */}
      {hasTiers && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setTierFilter("ALL")}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              tierFilter === "ALL"
                ? "bg-ds-text text-ds-card"
                : "bg-ds-surface text-ds-muted hover:bg-ds-card border border-ds-border",
            )}
          >
            All ({lessons.length})
          </button>
          {tierGroups.map((group) => {
            const colors = COURSE_TIER_COLORS[group.tier];
            const isActive = tierFilter === group.tier;
            return (
              <button
                key={group.tier}
                onClick={() => setTierFilter(group.tier)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                  isActive
                    ? `${colors.bg} ${colors.text} ring-1 ${colors.border}`
                    : "bg-ds-surface text-ds-muted hover:bg-ds-card border border-ds-border",
                )}
              >
                {COURSE_TIER_LABELS[group.tier]} ({group.lessons.length})
              </button>
            );
          })}
        </div>
      )}

      {/* Lesson groups */}
      {filteredGroups.map((group) => (
        <div key={group.tier}>
          {hasTiers && tierFilter === "ALL" && (
            <div className="flex items-center gap-2 mb-2 mt-2">
              <TierBadge tier={group.tier} />
              <span className="text-xs text-ds-muted">{group.lessons.length} lessons</span>
            </div>
          )}
          <div className="space-y-2">
            {group.lessons.map((lesson) => (
              <div
                key={lesson.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-ds-surface transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-blue-900/40 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0">
                    {lesson.order}
                  </span>
                  <span className="text-sm font-medium text-ds-text">
                    {lesson.title}
                  </span>
                  {!hasTiers && <TierBadge tier={lesson.tier} />}
                </div>
                <div className="flex items-center gap-3">
                  {lesson.durationMin > 0 && (
                    <span className="flex items-center gap-1 text-xs text-ds-muted">
                      <Clock className="h-3.5 w-3.5" />
                      {lesson.durationMin} min
                    </span>
                  )}
                  <PublishedBadge published={lesson.isPublished} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function AssignmentsTab({
  assignments,
}: {
  readonly assignments: ReadonlyArray<AssignmentItem>;
}) {
  if (assignments.length === 0) {
    return (
      <p className="text-sm text-ds-muted text-center py-8">
        No assignments have been added to this course yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {assignments.map((assignment) => (
        <div
          key={assignment.id}
          className="border border-ds-border rounded-lg p-4 hover:bg-ds-surface transition-colors"
        >
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-sm font-semibold text-ds-text">
              {assignment.title}
            </h4>
            <PublishedBadge published={assignment.isPublished} />
          </div>
          <div className="flex items-center gap-4 text-xs text-ds-muted">
            <span className="flex items-center gap-1">
              <CalendarClock className="h-3.5 w-3.5" />
              {formatDate(assignment.dueDate)}
            </span>
            <span>{assignment.maxPoints} pts</span>
            <span>{assignment.totalSubmissions} submissions</span>
            {assignment.pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-900/40 text-amber-400 border border-amber-800 font-medium">
                {assignment.pendingCount} pending
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function QuizzesTab({
  quizzes,
}: {
  readonly quizzes: ReadonlyArray<QuizItem>;
}) {
  if (quizzes.length === 0) {
    return (
      <p className="text-sm text-ds-muted text-center py-8">
        No quizzes have been added to this course yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {quizzes.map((quiz) => (
        <div
          key={quiz.id}
          className="border border-ds-border rounded-lg p-4 hover:bg-ds-surface transition-colors"
        >
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-sm font-semibold text-ds-text">
              {quiz.title}
            </h4>
            <PublishedBadge published={quiz.isPublished} />
          </div>
          {quiz.description && (
            <p className="text-xs text-ds-muted mb-2 line-clamp-2">
              {quiz.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-xs text-ds-muted">
            <span>{quiz.questionCount} questions</span>
            <span>Passing: {quiz.passingScore}%</span>
            <span>{quiz.attemptCount} attempts</span>
          </div>
        </div>
      ))}
    </div>
  );
}
