"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Mail, Send, Loader2, Plus, MessageSquare, Users } from "lucide-react";
import { ACTOR_TYPE_LABELS, CONVERSATION_TYPE_LABELS } from "@/lib/constants/communications";

interface Participant {
  readonly actorType: string;
  readonly actorId: string;
  readonly lastReadAt: string | null;
}

interface Conversation {
  readonly id: string;
  readonly type: string;
  readonly title: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly participants: readonly Participant[];
  readonly messages: readonly {
    readonly content: string;
    readonly senderType: string;
    readonly senderId: string;
    readonly createdAt: string;
  }[];
}

interface Message {
  readonly id: string;
  readonly senderType: string;
  readonly senderId: string;
  readonly content: string;
  readonly attachmentUrl: string | null;
  readonly attachmentName: string | null;
  readonly createdAt: string;
}

interface Props {
  readonly currentActorType: string;
  readonly currentActorId: string;
}

export function MessagingView({ currentActorType, currentActorId }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/messages/conversations");
      const data = await res.json();
      if (data.success) setConversations(data.data.data);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  const fetchMessages = useCallback(async (convId: string) => {
    try {
      const res = await fetch(`/api/messages/conversations/${convId}/messages`);
      const data = await res.json();
      if (data.success) setMessages(data.data.data);
      await fetch(`/api/messages/conversations/${convId}/read`, { method: "POST" });
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (selectedId) {
      fetchMessages(selectedId);
      const interval = setInterval(() => fetchMessages(selectedId), 10000);
      return () => clearInterval(interval);
    }
  }, [selectedId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || !input.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/messages/conversations/${selectedId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input }),
      });
      const data = await res.json();
      if (data.success) {
        setInput("");
        fetchMessages(selectedId);
      }
    } catch { /* ignore */ }
    setSending(false);
  }

  function getConversationDisplayName(conv: Conversation): string {
    if (conv.title) return conv.title;
    const other = conv.participants.find(
      (p) => !(p.actorType === currentActorType && p.actorId === currentActorId)
    );
    if (other) return `${ACTOR_TYPE_LABELS[other.actorType] ?? ""} Chat`;
    return CONVERSATION_TYPE_LABELS[conv.type] ?? "Conversation";
  }

  function isSelf(msg: Message): boolean {
    return msg.senderType === currentActorType && msg.senderId === currentActorId;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-500 text-sm mt-1">Direct and group conversations</p>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden" style={{ height: "calc(100vh - 220px)", minHeight: 400 }}>
        <div className="flex h-full">
          {/* Conversation list */}
          <div className="w-80 border-r border-gray-200 flex flex-col shrink-0">
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Users className="h-4 w-4" />
                <span>{conversations.length} conversations</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {loading ? (
                <div className="p-6 text-center text-gray-400 text-sm">Loading...</div>
              ) : conversations.length === 0 ? (
                <div className="p-6 text-center">
                  <Mail className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No conversations yet</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedId(conv.id)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition ${
                      selectedId === conv.id ? "bg-blue-50" : ""
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {getConversationDisplayName(conv)}
                    </p>
                    {conv.messages[0] && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {conv.messages[0].content}
                      </p>
                    )}
                    <p className="text-[10px] text-gray-300 mt-1">
                      {new Date(conv.updatedAt).toLocaleDateString()}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Message thread */}
          <div className="flex-1 flex flex-col min-w-0">
            {!selectedId ? (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <MessageSquare className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Select a conversation</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${isSelf(msg) ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                          isSelf(msg)
                            ? "bg-blue-600 text-white rounded-br-md"
                            : "bg-gray-100 text-gray-800 rounded-bl-md"
                        }`}
                      >
                        {!isSelf(msg) && (
                          <p className="text-[10px] font-medium mb-0.5 opacity-60">
                            {ACTOR_TYPE_LABELS[msg.senderType] ?? "User"}
                          </p>
                        )}
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        {msg.attachmentUrl && (
                          <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-xs underline mt-1 block">
                            {msg.attachmentName ?? "Attachment"}
                          </a>
                        )}
                        <p className={`text-[10px] mt-1 ${isSelf(msg) ? "text-blue-200" : "text-gray-400"}`}>
                          {new Date(msg.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSend} className="border-t border-gray-200 p-3">
                  <div className="flex items-end gap-2">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); }
                      }}
                      placeholder="Type a message..."
                      rows={1}
                      className="flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-24"
                    />
                    <button type="submit" disabled={sending || !input.trim()} className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 shrink-0">
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
