"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Search, Loader2, User } from "lucide-react";
import { ACTOR_TYPE_LABELS } from "@/lib/constants/communications";

interface Contact {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly actorType: string;
}

interface Props {
  readonly onClose: () => void;
  readonly onConversationCreated: (conversationId: string) => void;
}

export function NewConversationModal({ onClose, onConversationCreated }: Props) {
  const [search, setSearch] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [initialMessage, setInitialMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("search", q);
      const res = await fetch(`/api/messages/contacts?${params.toString()}`);
      const data = await res.json();
      if (data.success) setContacts(data.data);
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchContacts("");
  }, [fetchContacts]);

  useEffect(() => {
    const timer = setTimeout(() => fetchContacts(search), 300);
    return () => clearTimeout(timer);
  }, [search, fetchContacts]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "DIRECT",
          participantIds: [{ actorType: selected.actorType, actorId: selected.id }],
          initialMessage: initialMessage.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onConversationCreated(data.data.id);
      } else {
        setError(data.error ?? "Failed to start conversation");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setSubmitting(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">New Conversation</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 rounded-lg p-1"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Search contacts */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Search by name or email
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Find a trainer, student, admin..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Contact list */}
          <div className="border border-gray-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-6 text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span className="text-sm">Searching...</span>
              </div>
            ) : contacts.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-400">
                {search ? "No users found" : "No contacts available"}
              </div>
            ) : (
              contacts.map((contact) => (
                <button
                  key={`${contact.actorType}-${contact.id}`}
                  type="button"
                  onClick={() => setSelected(contact)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left border-b border-gray-50 last:border-0 ${
                    selected?.id === contact.id && selected?.actorType === contact.actorType
                      ? "bg-blue-50"
                      : ""
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{contact.name}</p>
                    <p className="text-xs text-gray-400 truncate">{contact.email}</p>
                  </div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 shrink-0">
                    {ACTOR_TYPE_LABELS[contact.actorType] ?? contact.actorType}
                  </span>
                </button>
              ))
            )}
          </div>

          {/* Selected contact indicator */}
          {selected && (
            <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 rounded-lg px-3 py-2">
              <User className="h-4 w-4 shrink-0" />
              <span>
                Messaging <strong>{selected.name}</strong>
                {" "}({ACTOR_TYPE_LABELS[selected.actorType] ?? selected.actorType})
              </span>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="ml-auto text-blue-400 hover:text-blue-600"
                aria-label="Remove selection"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Optional initial message */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              First message <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              placeholder="Type your opening message..."
              rows={3}
              className="w-full resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selected || submitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Start Conversation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
