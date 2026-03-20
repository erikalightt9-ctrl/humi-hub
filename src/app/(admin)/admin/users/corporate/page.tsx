import type { Metadata } from "next";
import { Suspense } from "react";
import { CorporateClient } from "@/components/admin/CorporateClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Corporate | HUMI Admin" };

export default function CorporatePage() {
  return (
    <Suspense>
      <CorporateClient />
    </Suspense>
  );
}
