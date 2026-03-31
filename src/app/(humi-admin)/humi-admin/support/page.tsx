import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LifeBuoy, CheckCircle2 } from "lucide-react";
import { getOpenSupportTickets } from "@/lib/repositories/humi-admin.repository";

export const metadata = { title: "Support | HUMI Admin" };

const PRIORITY_STYLES: Record<string, string> = {
  HIGH: "bg-red-100 text-red-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  LOW: "bg-green-100 text-green-700",
};

const STATUS_STYLES: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-purple-100 text-purple-700",
  RESOLVED: "bg-green-100 text-green-700",
};

export default async function HumiAdminSupportPage() {
  const session = await getServerSession(authOptions);
  const permissions = session?.user?.humiAdminPermissions;

  if (!session?.user || !session.user.isHumiAdmin) {
    redirect("/humi-admin/login");
  }

  if (!permissions?.canProvideSupport) {
    redirect("/humi-admin");
  }

  const tickets = await getOpenSupportTickets();

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <LifeBuoy className="w-6 h-6 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Support Tickets</h1>
          <p className="text-slate-500 text-sm">Open and in-progress platform support requests</p>
        </div>
      </div>

      {tickets.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">All clear!</p>
          <p className="text-slate-400 text-sm mt-1">No open support tickets at this time.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Subject</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Priority</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">From</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-slate-800 max-w-xs truncate">{ticket.subject}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_STYLES[ticket.priority] ?? "bg-slate-100 text-slate-600"}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[ticket.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {ticket.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs">{ticket.submitterType}</td>
                  <td className="px-5 py-3.5 text-slate-400 text-xs">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
