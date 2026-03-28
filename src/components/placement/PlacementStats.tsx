"use client";

import { CheckCircle, XCircle, Send, MessageSquare, Calendar } from "lucide-react";

interface PlacementStatsProps {
  readonly totalApplications: number;
  readonly interviewsCompleted: number;
  readonly resumeUploaded: boolean;
  readonly coachingBooked: number;
}

interface StatTile {
  readonly label: string;
  readonly value: React.ReactNode;
  readonly bg: string;
  readonly iconBg: string;
  readonly icon: React.ReactNode;
}

export function PlacementStats({
  totalApplications,
  interviewsCompleted,
  resumeUploaded,
  coachingBooked,
}: PlacementStatsProps) {
  const tiles: StatTile[] = [
    {
      label: "Applications Sent",
      value: <span className="text-2xl font-bold text-blue-700">{totalApplications}</span>,
      bg: "bg-blue-50 border-blue-200",
      iconBg: "bg-blue-100",
      icon: <Send className="w-5 h-5 text-blue-600" />,
    },
    {
      label: "Interviews Done",
      value: <span className="text-2xl font-bold text-indigo-700">{interviewsCompleted}</span>,
      bg: "bg-indigo-50 border-indigo-200",
      iconBg: "bg-indigo-100",
      icon: <MessageSquare className="w-5 h-5 text-indigo-600" />,
    },
    {
      label: "Resume Ready",
      value: resumeUploaded ? (
        <CheckCircle className="w-7 h-7 text-green-600" />
      ) : (
        <XCircle className="w-7 h-7 text-red-400" />
      ),
      bg: resumeUploaded
        ? "bg-green-50 border-green-200"
        : "bg-red-50 border-red-200",
      iconBg: resumeUploaded ? "bg-green-100" : "bg-red-100",
      icon: resumeUploaded ? (
        <CheckCircle className="w-5 h-5 text-green-600" />
      ) : (
        <XCircle className="w-5 h-5 text-red-400" />
      ),
    },
    {
      label: "Coaching Sessions",
      value: <span className="text-2xl font-bold text-teal-700">{coachingBooked}</span>,
      bg: "bg-teal-50 border-teal-200",
      iconBg: "bg-teal-100",
      icon: <Calendar className="w-5 h-5 text-teal-600" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className={`border rounded-xl p-5 flex flex-col gap-3 ${tile.bg}`}
        >
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tile.iconBg}`}>
            {tile.icon}
          </div>
          <div>{tile.value}</div>
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">{tile.label}</p>
        </div>
      ))}
    </div>
  );
}
