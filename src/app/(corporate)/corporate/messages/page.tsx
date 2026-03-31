import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { CorporateMessages } from "@/components/corporate/CorporateMessages";

export const metadata: Metadata = { title: "Messages | Humi Hub Corporate" };

export default async function CorporateMessagesPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || user.role !== "corporate") redirect("/corporate/login");

  return <CorporateMessages actorId={user.id} />;
}
