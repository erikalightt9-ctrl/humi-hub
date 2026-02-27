"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
}

export function Pagination({ page, totalPages, total, limit }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const goTo = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`${pathname}?${params.toString()}`);
  };

  const start = Math.min((page - 1) * limit + 1, total);
  const end = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-sm text-gray-500">
        Showing {start}–{end} of {total} results
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => goTo(page - 1)}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>
        <span className="text-sm text-gray-600">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => goTo(page + 1)}
          className="gap-1"
        >
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
