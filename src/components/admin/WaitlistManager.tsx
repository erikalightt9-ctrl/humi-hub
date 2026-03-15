"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpCircle, XCircle } from "lucide-react";
import type { WaitlistEntryDetail } from "@/lib/repositories/schedule.repository";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface WaitlistManagerProps {
  readonly scheduleId: string;
  readonly entries: ReadonlyArray<WaitlistEntryDetail>;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function WaitlistManager({ scheduleId, entries: initialEntries }: WaitlistManagerProps) {
  const [entries, setEntries] = React.useState(initialEntries);
  const [loading, setLoading] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function handleAction(action: "promote" | "cancel", enrollmentId?: string) {
    const key = action === "promote" ? "promote" : (enrollmentId ?? "");
    setLoading(key);
    setError(null);

    const res = await fetch(`/api/admin/schedules/${scheduleId}/waitlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, enrollmentId }),
    });

    const json = await res.json();
    setLoading(null);

    if (!json.success) {
      setError(json.error ?? "Something went wrong");
      return;
    }

    if (action === "promote") {
      // Remove first WAITING entry (was just promoted)
      setEntries((prev) => prev.slice(1));
    } else {
      setEntries((prev) =>
        prev.filter((e) => e.enrollment.id !== enrollmentId),
      );
    }
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-sm">No one is currently on the waitlist.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {entries.length} applicant{entries.length !== 1 ? "s" : ""} waiting
        </p>
        <Button
          variant="outline"
          size="sm"
          className="gap-1 text-indigo-600 border-indigo-300 hover:bg-indigo-50"
          disabled={loading === "promote"}
          onClick={() => handleAction("promote")}
        >
          <ArrowUpCircle className="h-4 w-4" />
          Promote Next
        </Button>
      </div>

      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-[60px]">#</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id} className="hover:bg-gray-50">
                <TableCell className="text-gray-500 font-medium">
                  {entry.position}
                </TableCell>
                <TableCell className="font-medium text-gray-900">
                  {entry.enrollment.fullName}
                </TableCell>
                <TableCell className="text-gray-600 text-sm">
                  {entry.enrollment.email}
                </TableCell>
                <TableCell className="text-gray-500 text-sm">
                  {new Date(entry.createdAt).toLocaleDateString("en-PH", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    disabled={loading === entry.enrollment.id}
                    onClick={() => handleAction("cancel", entry.enrollment.id)}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
