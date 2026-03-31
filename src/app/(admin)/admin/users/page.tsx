import type { Metadata } from "next";
import { Suspense } from "react";
import { UsersClient } from "@/components/admin/UsersClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Users | Humi Hub Admin" };

export default function UsersPage() {
  return (
    <Suspense>
      <UsersClient />
    </Suspense>
  );
}
