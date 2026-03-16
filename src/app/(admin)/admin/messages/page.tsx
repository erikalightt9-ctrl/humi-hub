import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { MessagingView } from "@/components/shared/MessagingView";
import { BroadcastMessageComposer } from "@/components/admin/BroadcastMessageComposer";

export const metadata: Metadata = { title: "Messages | HUMI Admin" };

export default async function AdminMessagesPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || user.role !== "admin") redirect("/portal?tab=admin");

  return (
    <div className="space-y-6">
      <BroadcastMessageComposer />
      <MessagingView currentActorType="ADMIN" currentActorId={user.id} />
    </div>
  );
}
