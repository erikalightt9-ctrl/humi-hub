"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";

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

const INITIAL_STATE: ResumeFormState = {
  fullName: "",
  email: "",
  phone: "",
  headline: "",
  summary: "",
  skills: "",
  experience: "",
  education: "",
};

function validate(form: ResumeFormState): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!form.fullName.trim()) {
    return { ...errors, fullName: "Full name is required." };
  }
  if (!form.email.trim() || !form.email.includes("@")) {
    return { ...errors, email: "A valid email address is required." };
  }
  if (!form.experience.trim()) {
    return { ...errors, experience: "Experience is required." };
  }
  if (!form.education.trim()) {
    return { ...errors, education: "Education is required." };
  }
  return errors;
}

export function ResumeForm() {
  const [form, setForm] = useState<ResumeFormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

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

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const validationErrors = validate(form);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      setLoading(true);
      setServerError(null);
      setSuccess(false);

      const skillsArray = form.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      try {
        const res = await fetch("/api/placement/resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: form.fullName.trim(),
            email: form.email.trim(),
            phone: form.phone.trim() || null,
            headline: form.headline.trim() || null,
            summary: form.summary.trim() || null,
            skills: skillsArray,
            experience: form.experience.trim(),
            education: form.education.trim(),
          }),
        });

        const json = await res.json();

        if (!res.ok || !json.success) {
          setServerError(json.error ?? "Failed to save resume. Please try again.");
          return;
        }

        setSuccess(true);
      } catch {
        setServerError("Network error. Please check your connection and try again.");
      } finally {
        setLoading(false);
      }
    },
    [form]
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-green-800 text-sm font-medium">
          Resume saved! Your profile has been updated successfully.
        </div>
      )}

      {serverError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
          {serverError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="flex flex-col gap-1">
          <label htmlFor="fullName" className="text-sm font-medium text-gray-700">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            id="fullName"
            type="text"
            value={form.fullName}
            onChange={handleChange("fullName")}
            placeholder="Maria Santos"
            className={`rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-blue-500 ${
              errors.fullName ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
            }`}
          />
          {errors.fullName && (
            <p className="text-xs text-red-500 mt-0.5">{errors.fullName}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={handleChange("email")}
            placeholder="maria@example.com"
            className={`rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-blue-500 ${
              errors.email ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
            }`}
          />
          {errors.email && (
            <p className="text-xs text-red-500 mt-0.5">{errors.email}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="phone" className="text-sm font-medium text-gray-700">
            Phone <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange("phone")}
            placeholder="+63 912 345 6789"
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="headline" className="text-sm font-medium text-gray-700">
            Professional Headline <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="headline"
            type="text"
            value={form.headline}
            onChange={handleChange("headline")}
            placeholder="Medical VA | Healthcare Admin Specialist"
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="skills" className="text-sm font-medium text-gray-700">
          Skills <span className="text-gray-400 font-normal">(comma-separated, optional)</span>
        </label>
        <input
          id="skills"
          type="text"
          value={form.skills}
          onChange={handleChange("skills")}
          placeholder="Electronic Health Records, Scheduling, Patient Communication"
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="summary" className="text-sm font-medium text-gray-700">
          Professional Summary <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="summary"
          rows={3}
          value={form.summary}
          onChange={handleChange("summary")}
          placeholder="A brief overview of your professional background and goals..."
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="experience" className="text-sm font-medium text-gray-700">
          Work Experience <span className="text-red-500">*</span>
        </label>
        <textarea
          id="experience"
          rows={5}
          value={form.experience}
          onChange={handleChange("experience")}
          placeholder="Describe your work history, roles, and key responsibilities..."
          className={`rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-blue-500 resize-none ${
            errors.experience ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
          }`}
        />
        {errors.experience && (
          <p className="text-xs text-red-500 mt-0.5">{errors.experience}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="education" className="text-sm font-medium text-gray-700">
          Education <span className="text-red-500">*</span>
        </label>
        <textarea
          id="education"
          rows={3}
          value={form.education}
          onChange={handleChange("education")}
          placeholder="List your degrees, certifications, and relevant training..."
          className={`rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-blue-500 resize-none ${
            errors.education ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
          }`}
        />
        {errors.education && (
          <p className="text-xs text-red-500 mt-0.5">{errors.education}</p>
        )}
      </div>

      <Button type="submit" disabled={loading} className="w-full sm:w-auto" size="lg">
        {loading ? "Saving Resume..." : "Save Resume"}
      </Button>
    </form>
  );
}
