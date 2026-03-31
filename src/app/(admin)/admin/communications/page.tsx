import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { MessageSquare } from "lucide-react";

export const metadata: Metadata = { title: "Communications | HUMI Hub Admin" };

export default async function CommunicationsPage() {
  const [contactMessages, forumStats] = await Promise.all([
    prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.forumThread.count(),
  ]);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Communications</h1>
        <p className="text-gray-500 text-sm mt-1">
          Contact messages and forum activity
        </p>
      </div>

      {/* Forum stats */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center gap-3">
        <div className="bg-blue-50 rounded-lg p-2">
          <MessageSquare className="h-5 w-5 text-blue-700" />
        </div>
        <p className="text-sm text-blue-800">
          <span className="font-semibold">{forumStats}</span> forum threads across all courses
        </p>
      </div>

      {/* Contact messages */}
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Contact Messages</h2>
      {contactMessages.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
          No contact messages received yet.
        </div>
      ) : (
        <div className="space-y-3">
          {contactMessages.map((msg) => (
            <div
              key={msg.id}
              className="bg-white rounded-xl border border-gray-200 p-5"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-gray-900">{msg.name}</p>
                  <p className="text-xs text-gray-500">{msg.email}</p>
                </div>
                <span className="text-xs text-gray-400">
                  {msg.createdAt.toLocaleDateString("en-PH", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">{msg.subject}</p>
              <p className="text-sm text-gray-600 line-clamp-3">{msg.message}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
