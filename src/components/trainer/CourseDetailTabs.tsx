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
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LessonItem {
  readonly id: string;
  readonly title: string;
  readonly order: number;
  readonly durationMin: number;
  readonly isPublished: boolean;
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
  readonly lessons: ReadonlyArray<LessonItem>;
  readonly assignments: ReadonlyArray<AssignmentItem>;
  readonly quizzes: ReadonlyArray<QuizItem>;
}

type TabKey = "lessons" | "assignments" | "quizzes";

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
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
      <CheckCircle2 className="h-3 w-3" />
      Published
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
      <XCircle className="h-3 w-3" />
      Draft
    </span>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CourseDetailTabs({
  lessons,
  assignments,
  quizzes,
}: CourseDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("lessons");

  const tabs: ReadonlyArray<{
    readonly key: TabKey;
    readonly label: string;
    readonly icon: React.ComponentType<{ className?: string }>;
    readonly count: number;
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
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      {/* Tab headers */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === tab.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            <span
              className={cn(
                "ml-1 px-1.5 py-0.5 rounded-full text-xs",
                activeTab === tab.key
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-500",
              )}
            >
              {tab.count}
            </span>
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
  if (lessons.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-8">
        No lessons have been added to this course yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {lessons.map((lesson) => (
        <div
          key={lesson.id}
          className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center shrink-0">
              {lesson.order}
            </span>
            <span className="text-sm font-medium text-gray-900">
              {lesson.title}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {lesson.durationMin > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="h-3.5 w-3.5" />
                {lesson.durationMin} min
              </span>
            )}
            <PublishedBadge published={lesson.isPublished} />
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
      <p className="text-sm text-gray-500 text-center py-8">
        No assignments have been added to this course yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {assignments.map((assignment) => (
        <div
          key={assignment.id}
          className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-900">
              {assignment.title}
            </h4>
            <PublishedBadge published={assignment.isPublished} />
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <CalendarClock className="h-3.5 w-3.5" />
              {formatDate(assignment.dueDate)}
            </span>
            <span>{assignment.maxPoints} pts</span>
            <span>{assignment.totalSubmissions} submissions</span>
            {assignment.pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
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
      <p className="text-sm text-gray-500 text-center py-8">
        No quizzes have been added to this course yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {quizzes.map((quiz) => (
        <div
          key={quiz.id}
          className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-900">
              {quiz.title}
            </h4>
            <PublishedBadge published={quiz.isPublished} />
          </div>
          {quiz.description && (
            <p className="text-xs text-gray-500 mb-2 line-clamp-2">
              {quiz.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>{quiz.questionCount} questions</span>
            <span>Passing: {quiz.passingScore}%</span>
            <span>{quiz.attemptCount} attempts</span>
          </div>
        </div>
      ))}
    </div>
  );
}
