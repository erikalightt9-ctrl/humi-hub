import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { MessagingView } from "@/components/shared/MessagingView";

export const metadata: Metadata = { title: "Messages | Humi Hub Trainer" };

export default async function TrainerMessagesPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || user.role !== "trainer") redirect("/trainer/login");

  return <MessagingView currentActorType="TRAINER" currentActorId={user.id} />;
}
