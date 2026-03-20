


"use client";
import { useState, useEffect } from "react";
import AssignmentManager from "@/components/admin/AssignmentManager";
import SubmissionGrader from "@/components/admin/SubmissionGrader";
import AssignmentAnalytics from "@/components/admin/AssignmentAnalytics";

export const dynamic = "force-dynamic";


type Tab = "submissions" | "manage" | "analytics";

export default function AdminAssignmentsPage() {


  const [tab, setTab] = useState<Tab>("submissions");

  const tabs: { id: Tab; label: string }[] = [

    { id: "submissions", label: "Pending Submissions" },

    { id: "manage", label: "Manage Assignments" },

    { id: "analytics", label: "Analytics" },


  ];

  return (

    <div className="space-y-6">

      <div>

        <h1 className="text-2xl font-bold text-gray-900">Assignments & Tasks</h1>

        <p className="text-gray-500 text-sm mt-1">

          Create assignments, review submissions, and track student progress

        </p>


      </div>

      {/* Tabs */}

      <div className="border-b border-gray-200">

        <nav className="-mb-px flex gap-6">

          {tabs.map((t) => (

            <button

              key={t.id}

              onClick={() => setTab(t.id)}

              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${

                tab === t.id

                  ? "border-blue-600 text-blue-600"

                  : "border-transparent text-gray-500 hover:text-gray-700"

              }`}

            >

              {t.label}

            </button>

          ))}

        </nav>


      </div>

      {tab === "submissions" && <SubmissionGrader role="admin" />}

      {tab === "manage" && <AssignmentManager />}

      {tab === "analytics" && <AssignmentAnalytics />}

    </div>

  );
}
}
