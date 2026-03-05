"use client";

import { useState, useCallback } from "react";
import {
  Briefcase,
  Loader2,
  Copy,
  Check,
  FileText,
  Mail,
  ScrollText,
  Receipt,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type DocumentType = "proposal" | "invoice" | "contract" | "email" | "sop";

interface GeneratedDocument {
  readonly type: DocumentType;
  readonly title: string;
  readonly content: string;
  readonly generatedAt: string;
}

/* ------------------------------------------------------------------ */
/*  Document type options                                              */
/* ------------------------------------------------------------------ */

const DOC_OPTIONS: ReadonlyArray<{
  readonly type: DocumentType;
  readonly label: string;
  readonly description: string;
  readonly icon: typeof FileText;
}> = [
  {
    type: "proposal",
    label: "Service Proposal",
    description: "Client-facing project proposal",
    icon: FileText,
  },
  {
    type: "invoice",
    label: "Invoice",
    description: "Professional billing document",
    icon: Receipt,
  },
  {
    type: "contract",
    label: "Service Agreement",
    description: "Contract between parties",
    icon: ScrollText,
  },
  {
    type: "email",
    label: "Business Email",
    description: "Professional correspondence",
    icon: Mail,
  },
  {
    type: "sop",
    label: "SOP",
    description: "Standard operating procedure",
    icon: ClipboardList,
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function BusinessAssistant() {
  const [selectedType, setSelectedType] = useState<DocumentType>("proposal");
  const [clientName, setClientName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [details, setDetails] = useState("");
  const [document, setDocument] = useState<GeneratedDocument | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (details.trim().length < 10) {
      setError("Please provide at least a brief description.");
      return;
    }

    setGenerating(true);
    setError(null);
    setDocument(null);

    try {
      const res = await fetch("/api/student/business-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedType,
          clientName,
          businessName,
          details,
        }),
      });
      const json = await res.json();

      if (json.success) {
        setDocument(json.data);
      } else {
        setError(json.error ?? "Failed to generate document");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setGenerating(false);
    }
  }, [selectedType, clientName, businessName, details]);

  const handleCopy = useCallback(async () => {
    if (!document) return;
    try {
      await navigator.clipboard.writeText(document.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = window.document.createElement("textarea");
      textarea.value = document.content;
      window.document.body.appendChild(textarea);
      textarea.select();
      window.document.execCommand("copy");
      window.document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [document]);

  return (
    <div className="space-y-6">
      {/* Document Type Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Choose Document Type
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {DOC_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.type}
                onClick={() => {
                  setSelectedType(opt.type);
                  setDocument(null);
                }}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-colors ${
                  selectedType === opt.type
                    ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Document Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Business Name
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g., VA Solutions Pro"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client Name
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g., ABC Company"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Details & Context
          </label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder={
              selectedType === "proposal"
                ? "Describe the services you want to propose, pricing ideas, timeline..."
                : selectedType === "invoice"
                  ? "Describe the services completed, hours worked, rates..."
                  : selectedType === "contract"
                    ? "Describe the services, duration, payment terms..."
                    : selectedType === "email"
                      ? "Describe the purpose of the email, key points to cover..."
                      : "Describe the process, who is responsible, expected outcomes..."
            }
            rows={4}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            {details.length} characters (min 10)
          </p>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={generating || details.trim().length < 10}
          className="gap-1.5"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Briefcase className="h-4 w-4" />
          )}
          {generating ? "Generating..." : "Generate Document"}
        </Button>

        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      {/* Generated Document */}
      {document && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">{document.title}</h3>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  Copy
                </>
              )}
            </Button>
          </div>

          <div className="bg-gray-50 rounded-lg p-5 border border-gray-100">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
              {document.content}
            </pre>
          </div>

          <p className="text-xs text-gray-400 mt-3">
            Generated{" "}
            {new Date(document.generatedAt).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      )}
    </div>
  );
}
