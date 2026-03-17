"use client";

import { useState, useEffect } from "react";

interface Analytics {
  total: number;
  submissions: number;
  pending: number;
  graded: number;
  completionRate: number;
  pendingReview: number;
}

export default function AssignmentAnalytics() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/assignments/analytics")
      .then((r) => r.json())
      .then((d) => { if (d.success) setData(d.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading analytics...</div>;
  }

  if (!data) {
    return <div className="text-center py-12 text-gray-400">Failed to load analytics</div>;
  }

  const cards = [
    { label: "Total Assignments", value: data.total, color: "bg-blue-50 text-blue-700" },
    { label: "Total Submissions", value: data.submissions, color: "bg-purple-50 text-purple-700" },
    { label: "Pending Review", value: data.pending, color: "bg-yellow-50 text-yellow-700" },
    { label: "Graded", value: data.graded, color: "bg-green-50 text-green-700" },
    { label: "Completion Rate", value: `${data.completionRate}%`, color: "bg-indigo-50 text-indigo-700" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-xl p-5 ${c.color}`}>
            <p className="text-3xl font-bold">{c.value}</p>
            <p className="text-sm font-medium mt-1 opacity-80">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Submission Breakdown</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Graded</span>
              <span>{data.graded} / {data.submissions}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${data.completionRate}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Pending Review</span>
              <span>{data.pending}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-yellow-400 h-2 rounded-full transition-all"
                style={{ width: data.submissions > 0 ? `${(data.pending / data.submissions) * 100}%` : "0%" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
