"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

export function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
          params.delete("page"); // reset pagination on filter change
        }
      });
      return params.toString();
    },
    [searchParams]
  );

  const push = (updates: Record<string, string | null>) => {
    router.push(`${pathname}?${createQueryString(updates)}`);
  };

  const hasFilters =
    searchParams.has("search") ||
    searchParams.has("status") ||
    searchParams.has("courseSlug");

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search name or email..."
          defaultValue={searchParams.get("search") ?? ""}
          className="pl-9"
          onChange={(e) => push({ search: e.target.value || null })}
        />
      </div>

      {/* Status filter */}
      <Select
        value={searchParams.get("status") ?? "ALL"}
        onValueChange={(v) => push({ status: v === "ALL" ? null : v })}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Statuses</SelectItem>
          <SelectItem value="PENDING">Pending</SelectItem>
          <SelectItem value="APPROVED">Approved</SelectItem>
          <SelectItem value="REJECTED">Rejected</SelectItem>
        </SelectContent>
      </Select>

      {/* Course filter */}
      <Select
        value={searchParams.get("courseSlug") ?? "ALL"}
        onValueChange={(v) => push({ courseSlug: v === "ALL" ? null : v })}
      >
        <SelectTrigger className="w-52">
          <SelectValue placeholder="Course" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Courses</SelectItem>
          <SelectItem value="MEDICAL_VA">Medical VA</SelectItem>
          <SelectItem value="REAL_ESTATE_VA">Real Estate VA</SelectItem>
          <SelectItem value="US_BOOKKEEPING_VA">US Bookkeeping VA</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear filters */}
      {hasFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            router.push(pathname)
          }
          className="gap-1 text-gray-600"
        >
          <X className="h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
}
