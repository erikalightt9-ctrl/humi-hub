"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Loader2, UserCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
};

type WidgetMode = "chat" | "escalating" | "submitted";

type EscalateForm = {
  name: string;
  email: string;
  message: string;
};

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: "Hi! 👋 I'm your HUMI Hub assistant. Ask me anything about our courses, enrollment, pricing, or how to get started!",
};

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<WidgetMode>("chat");
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [referenceNo, setReferenceNo] = useState("");

  // Escalation form state
  const [form, setForm] = useState<EscalateForm>({ name: "", email: "", message: "" });
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);
  useEffect(() => {
    if (isOpen && mode === "chat" && inputRef.current) inputRef.current.focus();
  }, [isOpen, mode]);

  // ── Send Chat Message ──────────────────────────────────────────────────────
  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    const userMessage: Message = { id: crypto.randomUUID(), role: "user", content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsStreaming(true);

    const assistantId = crypto.randomUUID();
    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

    try {
      const chatHistory = updatedMessages
        .filter((m) => m.id !== "welcome" && m.role !== "system")
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatHistory }),
      });

      // ── Escalation signal ─────────────────────────────────────────────────
      if (response.ok && response.headers.get("content-type")?.includes("application/json")) {
        const json = await response.json();
        if (json.escalate) {
          // Replace empty assistant bubble with escalation notice
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    role: "system",
                    content:
                      "I'm not the best person to answer that. Let me connect you with our support team! 🙋",
                  }
                : m
            )
          );
          setIsStreaming(false);
          // Pre-fill escalation message with user's question
          setForm((f) => ({ ...f, message: trimmed }));
          setTimeout(() => setMode("escalating"), 800);
          return;
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error ?? "Chat is temporarily unavailable. Please try again.");
      }

      // ── Stream response ───────────────────────────────────────────────────
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream available.");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;

          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: m.content + parsed.content } : m
                )
              );
            }
          } catch {
            // Skip malformed chunks
          }
        }
      }
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again or visit /contact for help.";
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, content: msg } : m))
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Submit Escalation Form ─────────────────────────────────────────────────
  const handleEscalateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!form.name.trim()) return setFormError("Please enter your name.");
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) return setFormError("Please enter a valid email address.");
    if (!form.message.trim()) return setFormError("Please describe your question.");

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/chat/escalate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to submit.");
      setReferenceNo(json.data?.referenceNo ?? "");
      setMode("submitted");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Reset ──────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setMode("chat");
    setMessages([WELCOME_MESSAGE]);
    setForm({ name: "", email: "", message: "" });
    setFormError("");
    setReferenceNo("");
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden max-h-[75vh]">

          {/* Header */}
          <div className="bg-blue-700 text-white px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <div>
                <p className="font-semibold text-sm">HUMI Hub Assistant</p>
                <p className="text-xs text-blue-200">
                  {mode === "escalating" ? "Connect with support" : mode === "submitted" ? "Message sent!" : "Ask about courses & enrollment"}
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-blue-600 transition-colors" aria-label="Close chat">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* ── CHAT MODE ───────────────────────────────────────────────────── */}
          {mode === "chat" && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                        message.role === "user"
                          ? "bg-blue-700 text-white rounded-br-md"
                          : message.role === "system"
                          ? "bg-amber-50 text-amber-800 border border-amber-200 rounded-bl-md"
                          : "bg-gray-100 text-gray-800 rounded-bl-md"
                      )}
                    >
                      {message.content || (
                        <span className="flex items-center gap-1 text-gray-400">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Thinking...
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="border-t border-gray-200 p-3 shrink-0">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your question..."
                    rows={1}
                    className="flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-24 overflow-y-auto"
                    disabled={isStreaming}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isStreaming}
                    className={cn(
                      "p-2.5 rounded-xl transition-colors shrink-0",
                      input.trim() && !isStreaming
                        ? "bg-blue-700 text-white hover:bg-blue-800"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    )}
                    aria-label="Send message"
                  >
                    {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5 text-center">
                  Powered by AI — responses may not always be accurate
                </p>
              </div>
            </>
          )}

          {/* ── ESCALATION FORM ─────────────────────────────────────────────── */}
          {mode === "escalating" && (
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-start gap-3 mb-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <UserCheck className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-800">
                  Our support team will get back to you shortly. Leave your details and we'll reach out!
                </p>
              </div>

              <form onSubmit={handleEscalateSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Your Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Maria Santos"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Your Question *</label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    placeholder="Describe what you need help with..."
                    rows={3}
                    className="w-full resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {formError && (
                  <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {formError}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setMode("chat")}
                    className="flex-1 py-2 text-sm rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Back to chat
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2 text-sm rounded-xl bg-blue-700 text-white hover:bg-blue-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send message"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── SUBMITTED CONFIRMATION ───────────────────────────────────────── */}
          {mode === "submitted" && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-base">Message received! 🎉</p>
                <p className="text-sm text-gray-500 mt-1">
                  Our support team will reply to your email shortly.
                </p>
              </div>
              {referenceNo && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 w-full">
                  <p className="text-xs text-gray-500">Reference number</p>
                  <p className="text-sm font-mono font-semibold text-blue-700">{referenceNo}</p>
                </div>
              )}
              <button
                onClick={handleReset}
                className="w-full py-2.5 text-sm rounded-xl bg-blue-700 text-white hover:bg-blue-800 transition-colors"
              >
                Start new conversation
              </button>
            </div>
          )}
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          "fixed bottom-4 right-4 sm:right-6 z-50 p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-105",
          isOpen ? "bg-gray-600 hover:bg-gray-700" : "bg-blue-700 hover:bg-blue-800"
        )}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <MessageCircle className="h-6 w-6 text-white" />
        )}
      </button>
    </>
  );
}
