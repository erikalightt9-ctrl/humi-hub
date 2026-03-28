"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface JobFormData {
  title: string;
  description: string;
  requirements: string;
  skills: string;
  location: string;
  type: string;
  salaryRange: string;
  industry: string;
}

export function JobPostingForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<JobFormData>({
    title: "",
    description: "",
    requirements: "",
    skills: "",
    location: "",
    type: "Full-time",
    salaryRange: "",
    industry: "",
  });

  function update(field: keyof JobFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      title: form.title,
      description: form.description,
      requirements: form.requirements.split("\n").map((s) => s.trim()).filter(Boolean),
      skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
      location: form.location,
      type: form.type,
      salaryRange: form.salaryRange || undefined,
      industry: form.industry || undefined,
    };

    const res = await fetch("/api/employer/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json() as { success: boolean; error?: string };
    setLoading(false);

    if (!data.success) {
      setError(data.error ?? "Failed to post job");
      return;
    }

    router.push("/employer-dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-xl border border-gray-200 p-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Medical Virtual Assistant"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
          <input
            type="text"
            required
            value={form.location}
            onChange={(e) => update("location", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Remote / USA"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Job Type *</label>
          <select
            value={form.type}
            onChange={(e) => update("type", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {["Full-time", "Part-time", "Contract", "Freelance"].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
          <input
            type="text"
            value={form.industry}
            onChange={(e) => update("industry", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Healthcare, Real Estate…"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Salary Range</label>
          <input
            type="text"
            value={form.salaryRange}
            onChange={(e) => update("salaryRange", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="$800–$1,500/mo"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
          <textarea
            required
            rows={5}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Describe the role, responsibilities, and your company…"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Requirements <span className="text-gray-400">(one per line)</span>
          </label>
          <textarea
            rows={4}
            value={form.requirements}
            onChange={(e) => update("requirements", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder={"1+ year experience\nStrong English communication\nFamiliarity with EHR systems"}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Required Skills <span className="text-gray-400">(comma-separated)</span>
          </label>
          <input
            type="text"
            value={form.skills}
            onChange={(e) => update("skills", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Medical Terminology, EHR, HIPAA, Google Workspace"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-900 hover:bg-blue-800 text-white font-bold"
        >
          {loading ? "Posting…" : "Post Job"}
        </Button>
      </div>
    </form>
  );
}
