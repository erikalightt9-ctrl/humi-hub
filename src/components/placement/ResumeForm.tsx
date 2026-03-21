"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle2 } from "lucide-react";

interface ResumeFormState {
  readonly fullName: string;
  readonly email: string;
  readonly phone: string;
  readonly headline: string;
  readonly summary: string;
  readonly skills: string;
  readonly experience: string;
  readonly education: string;
}

interface ValidationErrors {
  readonly fullName?: string;
  readonly email?: string;
  readonly experience?: string;
  readonly education?: string;
}

interface AIImprovement {
  improvedHeadline: string;
  improvedSummary: string;
  skillSuggestions: string[];
  experienceTips: string[];
  overallScore: number;
  feedback: string;
}

const INITIAL_STATE: ResumeFormState = {
  fullName: "", email: "", phone: "", headline: "",
  summary: "", skills: "", experience: "", education: "",
};

function validate(form: ResumeFormState): ValidationErrors {
  if (!form.fullName.trim()) return { fullName: "Full name is required." };
  if (!form.email.trim() || !form.email.includes("@")) return { email: "A valid email is required." };
  if (!form.experience.trim()) return { experience: "Experience is required." };
  if (!form.education.trim()) return { education: "Education is required." };
  return {};
}

export function ResumeForm() {
  const [form, setForm] = useState<ResumeFormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AIImprovement | null>(null);

  const handleChange = useCallback(
    (field: keyof ResumeFormState) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
        setServerError(null);
        setSuccess(false);
      },
    []
  );

  /* Save resume */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const validationErrors = validate(form);
      if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }

      setLoading(true);
      setServerError(null);
      setSuccess(false);

      const skillsArray = form.skills.split(",").map((s) => s.trim()).filter(Boolean);

      try {
        const res = await fetch("/api/placement/resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: form.fullName.trim(), email: form.email.trim(),
            phone: form.phone.trim() || null, headline: form.headline.trim() || null,
            summary: form.summary.trim() || null, skills: skillsArray,
            experience: form.experience.trim(), education: form.education.trim(),
          }),
        });
        const json = await res.json() as { success: boolean; error?: string };
        if (!res.ok || !json.success) { setServerError(json.error ?? "Failed to save resume."); return; }
        setSuccess(true);
      } catch {
        setServerError("Network error. Please check your connection.");
      } finally {
        setLoading(false);
      }
    },
    [form]
  );

  /* AI improve */
  async function handleAIImprove() {
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }

    setAiLoading(true);
    setAiResult(null);
    setServerError(null);

    try {
      const skillsArray = form.skills.split(",").map((s) => s.trim()).filter(Boolean);
      const res = await fetch("/api/placement/resume/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim(), headline: form.headline.trim() || undefined,
          summary: form.summary.trim() || undefined, skills: skillsArray,
          experience: form.experience.trim(), education: form.education.trim(),
        }),
      });
      const json = await res.json() as { success: boolean; data?: { improvement: AIImprovement; aiPowered: boolean }; error?: string };
      if (!json.success) { setServerError(json.error ?? "AI improvement failed."); return; }
      if (json.data?.improvement) setAiResult(json.data.improvement);
    } catch {
      setServerError("AI service unavailable. Please try again later.");
    } finally {
      setAiLoading(false);
    }
  }

  /* Apply AI suggestions to form */
  function applyAISuggestions() {
    if (!aiResult) return;
    setForm((prev) => ({
      ...prev,
      headline: aiResult.improvedHeadline || prev.headline,
      summary: aiResult.improvedSummary || prev.summary,
    }));
    setAiResult(null);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {success && (
          <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-green-800 text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> Resume saved successfully!
          </div>
        )}
        {serverError && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">{serverError}</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Full Name */}
          <div className="flex flex-col gap-1">
            <label htmlFor="fullName" className="text-sm font-medium text-gray-700">Full Name <span className="text-red-500">*</span></label>
            <input id="fullName" type="text" value={form.fullName} onChange={handleChange("fullName")} placeholder="Maria Santos"
              className={`rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${errors.fullName ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"}`} />
            {errors.fullName && <p className="text-xs text-red-500">{errors.fullName}</p>}
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></label>
            <input id="email" type="email" value={form.email} onChange={handleChange("email")} placeholder="maria@example.com"
              className={`rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"}`} />
            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-1">
            <label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone <span className="text-gray-400 font-normal">(optional)</span></label>
            <input id="phone" type="tel" value={form.phone} onChange={handleChange("phone")} placeholder="+63 912 345 6789"
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Headline */}
          <div className="flex flex-col gap-1">
            <label htmlFor="headline" className="text-sm font-medium text-gray-700">Professional Headline <span className="text-gray-400 font-normal">(optional)</span></label>
            <input id="headline" type="text" value={form.headline} onChange={handleChange("headline")} placeholder="Medical VA | Healthcare Admin Specialist"
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {/* Skills */}
        <div className="flex flex-col gap-1">
          <label htmlFor="skills" className="text-sm font-medium text-gray-700">Skills <span className="text-gray-400 font-normal">(comma-separated)</span></label>
          <input id="skills" type="text" value={form.skills} onChange={handleChange("skills")} placeholder="Electronic Health Records, Scheduling, Patient Communication"
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        {/* Summary */}
        <div className="flex flex-col gap-1">
          <label htmlFor="summary" className="text-sm font-medium text-gray-700">Professional Summary <span className="text-gray-400 font-normal">(optional)</span></label>
          <textarea id="summary" rows={3} value={form.summary} onChange={handleChange("summary")} placeholder="A brief overview of your professional background..."
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>

        {/* Experience */}
        <div className="flex flex-col gap-1">
          <label htmlFor="experience" className="text-sm font-medium text-gray-700">Work Experience <span className="text-red-500">*</span></label>
          <textarea id="experience" rows={5} value={form.experience} onChange={handleChange("experience")} placeholder="Describe your work history, roles, and key responsibilities..."
            className={`rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none ${errors.experience ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"}`} />
          {errors.experience && <p className="text-xs text-red-500">{errors.experience}</p>}
        </div>

        {/* Education */}
        <div className="flex flex-col gap-1">
          <label htmlFor="education" className="text-sm font-medium text-gray-700">Education <span className="text-red-500">*</span></label>
          <textarea id="education" rows={3} value={form.education} onChange={handleChange("education")} placeholder="List your degrees, certifications, and relevant training..."
            className={`rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none ${errors.education ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"}`} />
          {errors.education && <p className="text-xs text-red-500">{errors.education}</p>}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={loading} size="lg" className="bg-blue-900 hover:bg-blue-800 text-white font-bold">
            {loading ? "Saving…" : "Save Resume"}
          </Button>
          <Button type="button" variant="outline" disabled={aiLoading} onClick={handleAIImprove} size="lg" className="gap-2 border-purple-300 text-purple-700 hover:bg-purple-50">
            <Sparkles className="h-4 w-4" />
            {aiLoading ? "Analysing with AI…" : "AI Improve"}
          </Button>
        </div>
      </form>

      {/* AI Result Panel */}
      {aiResult && (
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <h3 className="font-extrabold text-purple-900">AI Resume Analysis</h3>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-purple-700">Score:</span>
              <span className={`text-lg font-extrabold ${aiResult.overallScore >= 80 ? "text-green-600" : aiResult.overallScore >= 60 ? "text-amber-600" : "text-red-600"}`}>
                {aiResult.overallScore}/100
              </span>
            </div>
          </div>

          <p className="text-sm text-purple-800 leading-relaxed">{aiResult.feedback}</p>

          {aiResult.improvedHeadline && (
            <div>
              <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">Improved Headline</p>
              <p className="text-sm text-gray-800 bg-white rounded-lg px-3 py-2 border border-purple-200">{aiResult.improvedHeadline}</p>
            </div>
          )}

          {aiResult.improvedSummary && (
            <div>
              <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">Improved Summary</p>
              <p className="text-sm text-gray-800 bg-white rounded-lg px-3 py-2 border border-purple-200 leading-relaxed">{aiResult.improvedSummary}</p>
            </div>
          )}

          {aiResult.skillSuggestions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">Suggested Skills to Add</p>
              <div className="flex flex-wrap gap-2">
                {aiResult.skillSuggestions.map((s) => (
                  <span key={s} className="bg-white border border-purple-200 text-purple-800 text-xs px-2 py-1 rounded-full font-medium">{s}</span>
                ))}
              </div>
            </div>
          )}

          {aiResult.experienceTips.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">Experience Tips</p>
              <ul className="space-y-1">
                {aiResult.experienceTips.map((t) => (
                  <li key={t} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-purple-500 mt-0.5">•</span> {t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button onClick={applyAISuggestions} className="bg-purple-700 hover:bg-purple-800 text-white font-bold gap-2">
              <CheckCircle2 className="h-4 w-4" /> Apply AI Suggestions
            </Button>
            <Button variant="outline" onClick={() => setAiResult(null)} className="border-purple-300 text-purple-700">
              Dismiss
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
