import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { TrainingAnnouncements } from "@/components/corporate/TrainingAnnouncements";

export const metadata: Metadata = { title: "Announcements | HUMI Corporate" };

export default async function CorporateAnnouncementsPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || user.role !== "corporate") redirect("/corporate/login");

  return <TrainingAnnouncements actorId={user.id} />;
}
