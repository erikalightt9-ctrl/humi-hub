"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
      <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
      <p className="text-gray-500 text-sm mb-6 max-w-sm">
        We encountered an unexpected error. Please try again or return to the homepage.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={reset}>
          Try Again
        </Button>
        <Button asChild className="bg-blue-700 hover:bg-blue-800">
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    </div>
  );
}
