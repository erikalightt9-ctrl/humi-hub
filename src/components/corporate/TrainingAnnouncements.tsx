"use client";

import { useState, useEffect, useCallback } from "react";
import { Megaphone, Plus, Send, Loader2, Users } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Conversation {
  readonly id: string;
  readonly type: string;
  readonly title: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly participants: readonly {
    readonly actorType: string;
    readonly actorId: string;
    readonly lastReadAt: string | null;
  }[];
  readonly messages: readonly {
    readonly content: string;
    readonly senderType: string;
    readonly senderId: string;
    readonly createdAt: string;
  }[];
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface Props {
  readonly actorId: string;
}

export function TrainingAnnouncements({ actorId }: Props) {
  const [announcements, setAnnouncements] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await fetch("/api/messages/conversations");
      const data = await res.json();
      if (data.success) {
        const filtered = (data.data.data as Conversation[]).filter(
          (c) => c.type === "ANNOUNCEMENT"
        );
        setAnnouncements(filtered);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    setSending(true);
    try {
      // Create announcement conversation
      const res = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "ANNOUNCEMENT",
          title,
          participantIds: [],
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Send the first message
        await fetch(`/api/messages/conversations/${data.data.id}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: message }),
        });
        setTitle("");
        setMessage("");
        setShowCreate(false);
        fetchAnnouncements();
      }
    } catch { /* ignore */ }
    setSending(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Training Announcements</h1>
          <p className="text-gray-500 text-sm mt-1">
            Broadcast updates to your training teams
          </p>
        </div>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> New Announcement
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl shadow p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Announcement Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., New training schedule for Q2"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your announcement..."
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Publish Announcement
            </button>
          </div>
        </form>
      )}

      {/* Announcements List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-400 text-sm">
            Loading announcements...
          </div>
        ) : announcements.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <Megaphone className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No announcements yet</p>
          </div>
        ) : (
          announcements.map((ann) => (
            <div key={ann.id} className="bg-white rounded-xl shadow p-5 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-blue-600 shrink-0" />
                  <h3 className="font-semibold text-gray-900">
                    {ann.title ?? "Announcement"}
                  </h3>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Users className="h-3 w-3" />
                  <span>{ann.participants.length}</span>
                </div>
              </div>
              {ann.messages[0] && (
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {ann.messages[0].content}
                </p>
              )}
              <p className="text-[10px] text-gray-400">
                {new Date(ann.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
