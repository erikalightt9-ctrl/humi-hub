"use client";

import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

export interface FeedbackData {
  readonly aiFeedback: string;
  readonly overallScore: number;
  readonly communicationScore: number;
  readonly knowledgeScore: number;
  readonly problemSolvingScore: number;
  readonly professionalismScore: number;
}

interface ScoreBarProps {
  readonly label: string;
  readonly value: number;
  readonly color: string;
}

function ScoreProgressBar({ label, value, color }: ScoreBarProps) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="font-semibold text-gray-900">{value}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

interface InterviewFeedbackProps {
  readonly feedback: FeedbackData;
  readonly onReset: () => void;
}

export function InterviewFeedback({ feedback, onReset }: InterviewFeedbackProps) {
  const scoreBars: ScoreBarProps[] = [
    { label: "Overall Score", value: feedback.overallScore, color: "bg-blue-500" },
    { label: "Communication", value: feedback.communicationScore, color: "bg-indigo-500" },
    { label: "Knowledge", value: feedback.knowledgeScore, color: "bg-sky-500" },
    { label: "Problem Solving", value: feedback.problemSolvingScore, color: "bg-teal-500" },
    { label: "Professionalism", value: feedback.professionalismScore, color: "bg-green-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-blue-50 border border-blue-100 px-5 py-4">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">AI Feedback</h3>
        <p className="text-gray-700 text-sm leading-relaxed">{feedback.aiFeedback}</p>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-800">Your Scores</h3>
        {scoreBars.map((bar) => (
          <ScoreProgressBar key={bar.label} label={bar.label} value={bar.value} color={bar.color} />
        ))}
      </div>

      <Button onClick={onReset} variant="outline">
        <RotateCcw className="w-4 h-4" />
        Start New Interview
      </Button>
    </div>
  );
}
