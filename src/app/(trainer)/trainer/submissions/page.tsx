import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import TrainerGradingQueue from "@/components/trainer/TrainerGradingQueue";

export const metadata: Metadata = {
  title: "Grading Queue | HUMI Trainer Portal",
};
export const dynamic = "force-dynamic";

export default async function TrainerSubmissionsPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as
    | (typeof session & { user: { id: string; role: string } })["user"]
    | undefined;

  if (!user || user.role !== "trainer") {
    redirect("/trainer/login");
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ds-text">Grading Queue</h1>
        <p className="text-ds-muted text-sm mt-1">
          Review and grade pending student submissions.
        </p>
      </div>
      <TrainerGradingQueue />
    </>
  );
}
