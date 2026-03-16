"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Mail, Send, Loader2, Plus, MessageSquare, Users, Search, Paperclip, X } from "lucide-react";
import { ACTOR_TYPE_LABELS, CONVERSATION_TYPE_LABELS } from "@/lib/constants/communications";
import { NewConversationModal } from "./NewConversationModal";

interface Participant {
  readonly actorType: string;
  readonly actorId: string;
  readonly lastReadAt: string | null;
  readonly displayName: string | null;
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

interface MessageRead {
  readonly actorType: string;
  readonly actorId: string;
}

interface Message {
  readonly id: string;
  readonly senderType: string;
  readonly senderId: string;
  readonly content: string;
  readonly attachmentUrl: string | null;
  readonly attachmentName: string | null;
  readonly createdAt: string;
  readonly reads?: readonly MessageRead[];
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
  const [showCompose, setShowCompose] = useState(false);
  const [search, setSearch] = useState("");
  const [pendingFile, setPendingFile] = useState<{ url: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    if (!selectedId) return;

    // Initial load
    fetchMessages(selectedId);

    // Real-time updates via SSE (falls back gracefully if connection drops)
    const es = new EventSource(`/api/messages/conversations/${selectedId}/stream`);

    es.onmessage = (event) => {
      try {
        const incoming: Message[] = JSON.parse(event.data);
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const fresh = incoming.filter((m) => !existingIds.has(m.id));
          return fresh.length > 0 ? [...prev, ...fresh] : prev;
        });
        // Mark new messages read
        fetch(`/api/messages/conversations/${selectedId}/read`, { method: "POST" }).catch(() => {});
      } catch { /* malformed event */ }
    };

    es.onerror = () => {
      // SSE connection lost — fall back to 10s polling
      es.close();
      const interval = setInterval(() => fetchMessages(selectedId), 10000);
      return () => clearInterval(interval);
    };

    return () => es.close();
  }, [selectedId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/messages/upload", { method: "POST", body: form });
      const data = await res.json();
      if (data.success) {
        setPendingFile(data.data);
      }
    } catch { /* ignore */ }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || (!input.trim() && !pendingFile)) return;
    setSending(true);
    try {
      const res = await fetch(`/api/messages/conversations/${selectedId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: input || (pendingFile ? pendingFile.name : ""),
          attachmentUrl: pendingFile?.url ?? null,
          attachmentName: pendingFile?.name ?? null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setInput("");
        setPendingFile(null);
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
    if (other) {
      if (other.displayName) return other.displayName;
      return `${ACTOR_TYPE_LABELS[other.actorType] ?? ""} Chat`;
    }
    return CONVERSATION_TYPE_LABELS[conv.type] ?? "Conversation";
  }

  const filteredConversations = search.trim()
    ? conversations.filter((conv) =>
        getConversationDisplayName(conv)
          .toLowerCase()
          .includes(search.trim().toLowerCase())
      )
    : conversations;

  function handleConversationCreated(conversationId: string) {
    setShowCompose(false);
    fetchConversations();
    setSelectedId(conversationId);
  }

  function isSelf(msg: Message): boolean {
    return msg.senderType === currentActorType && msg.senderId === currentActorId;
  }

  const selectedConv = conversations.find((c) => c.id === selectedId);

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
            <div className="p-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Users className="h-4 w-4" />
                <span>{conversations.length} conversations</span>
              </div>
              <button
                onClick={() => setShowCompose(true)}
                className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition"
                title="New conversation"
              >
                <Plus className="h-3.5 w-3.5" />
                Compose
              </button>
            </div>
            {conversations.length > 0 && (
              <div className="px-3 py-2 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search conversations..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50"
                  />
                </div>
              </div>
            )}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {loading ? (
                <div className="p-6 text-center text-gray-400 text-sm">Loading...</div>
              ) : conversations.length === 0 ? (
                <div className="p-6 text-center">
                  <Mail className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400 mb-3">No conversations yet</p>
                  <button
                    onClick={() => setShowCompose(true)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
                  >
                    Start your first conversation
                  </button>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-400">
                  No conversations match &ldquo;{search}&rdquo;
                </div>
              ) : (
                filteredConversations.map((conv) => (
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
                  <p className="text-sm mb-3">Select a conversation</p>
                  <button
                    onClick={() => setShowCompose(true)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 mx-auto"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    New message
                  </button>
                </div>
              </div>
            ) : (
              <>
                {selectedConv && (
                  <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 truncate">
                      {getConversationDisplayName(selectedConv)}
                    </span>
                    <span className="ml-auto text-[10px] text-gray-400 shrink-0">
                      {CONVERSATION_TYPE_LABELS[selectedConv.type] ?? selectedConv.type}
                    </span>
                  </div>
                )}
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
                        <div className={`flex items-center gap-1 mt-1 ${isSelf(msg) ? "justify-end" : "justify-start"}`}>
                          <span className={`text-[10px] ${isSelf(msg) ? "text-blue-200" : "text-gray-400"}`}>
                            {new Date(msg.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                          </span>
                          {isSelf(msg) && (
                            <span className={`text-[11px] font-bold leading-none ${
                              msg.reads && msg.reads.length > 0 ? "text-blue-300" : "text-blue-400/50"
                            }`} title={msg.reads && msg.reads.length > 0 ? "Read" : "Sent"}>
                              {msg.reads && msg.reads.length > 0 ? "✓✓" : "✓"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSend} className="border-t border-gray-200 p-3 space-y-2">
                  {pendingFile && (
                    <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5 text-xs text-blue-700">
                      <Paperclip className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate flex-1">{pendingFile.name}</span>
                      <button type="button" onClick={() => setPendingFile(null)} className="shrink-0 text-blue-400 hover:text-blue-600">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  <div className="flex items-end gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                      onChange={handleFileChange}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition shrink-0 disabled:opacity-50"
                      title="Attach file"
                    >
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                    </button>
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); }
                      }}
                      placeholder="Type a message... (Enter to send, Shift+Enter for newline)"
                      rows={1}
                      className="flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-24"
                    />
                    <button type="submit" disabled={sending || (!input.trim() && !pendingFile)} className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 shrink-0">
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>

      {showCompose && (
        <NewConversationModal
          onClose={() => setShowCompose(false)}
          onConversationCreated={handleConversationCreated}
        />
      )}
    </div>
  );
}
